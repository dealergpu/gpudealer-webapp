'use client';

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import type { Messages } from "@/i18n/messages";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ExternalLink, ImagePlus, Loader2, Trash2, X } from "lucide-react";
import {
  ApiError,
  getGetMyProfileQueryKey,
  useCheckUsername,
  useGetMyProfile,
  useUpdateProfile,
  type UserProfile,
  type UserProfileUpdate,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { createClientSafely } from "@/lib/supabase/client";
import { photoPathFromUrl, removeListingPhotos } from "@/lib/supabase/listing-photos";
import {
  ACCEPTED_PROFILE_PHOTO_TYPES,
  uploadProfilePhoto,
  validateProfilePhoto,
  type ProfilePhotoKind,
} from "@/lib/supabase/profile-photos";
import { USERNAME_PATTERN, profileInitials, profilePath } from "@/lib/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const SHORT_BIO_MAX = 160;
const BIO_MAX = 2000;

// "x.com/me" -> "https://x.com/me". Anything that already has a scheme is
// left alone, so `javascript:` links still fail the check below.
function withProtocol(value: string): string {
  return value && !/^[a-z][a-z0-9+.-]*:/i.test(value) ? `https://${value}` : value;
}

// Same rule as the API: http(s) only, and on the given domains (or their
// subdomains) when listed.
function isAllowedLink(value: string, domains?: string[]): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  if (!domains) return true;
  const host = url.hostname.toLowerCase();
  return domains.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

const makeProfileSchema = (t: Messages) => {
  const p = t.profileEdit;
  const link = (domains?: string[]) =>
    z
      .string()
      .trim()
      .max(2048, p.linkTooLong)
      .transform(withProtocol)
      .refine((v) => v === "" || isAllowedLink(v, domains), {
        message: domains ? fmt(p.mustLinkTo, { domains: domains.join(p.or) }) : p.mustBeHttp,
      });

  return z.object({
    username: z
      .string()
      .trim()
      .toLowerCase()
      .regex(USERNAME_PATTERN, p.usernameRule),
    name: z.string().trim().max(255, p.nameTooLong),
    companyName: z.string().trim().max(255, p.companyTooLong),
    city: z.string().trim().max(100, p.cityTooLong),
    country: z.string().trim().max(100, p.countryTooLong),
    shortBio: z.string().trim().max(SHORT_BIO_MAX, fmt(t.validation.maxChars, { max: SHORT_BIO_MAX })),
    bio: z.string().trim().max(BIO_MAX, fmt(t.validation.maxChars, { max: BIO_MAX })),
    website: link(),
    x: link(["x.com", "twitter.com"]),
    instagram: link(["instagram.com"]),
    facebook: link(["facebook.com", "fb.com"]),
    tiktok: link(["tiktok.com"]),
  });
};

type ProfileSchema = ReturnType<typeof makeProfileSchema>;
type ProfileInput = z.input<ProfileSchema>;
type ProfileValues = z.output<ProfileSchema>;
type FieldName = keyof ProfileInput;

// The API can't clear these (they require at least one character), so an
// emptied field is a validation error rather than a silently ignored change.
const REQUIRED_ONCE_SET = ["name", "companyName", "city", "country"] as const;
// These clear to null when emptied.
const CLEARABLE = ["shortBio", "bio", "website", "x", "instagram", "facebook", "tiktok"] as const;

type PictureField = "profilePic" | "coverPic";
const PICTURE_KIND: Record<PictureField, ProfilePhotoKind> = { profilePic: "avatar", coverPic: "cover" };

function toFormValues(profile: UserProfile): ProfileInput {
  return {
    username: profile.username,
    name: profile.name ?? "",
    companyName: profile.companyName ?? "",
    city: profile.city ?? "",
    country: profile.country ?? "",
    shortBio: profile.shortBio ?? "",
    bio: profile.bio ?? "",
    website: profile.website ?? "",
    x: profile.x ?? "",
    instagram: profile.instagram ?? "",
    facebook: profile.facebook ?? "",
    tiktok: profile.tiktok ?? "",
  };
}

/** `error.fields` values may be a message or a list of messages. */
function fieldMessage(value: unknown, fallback: string): string {
  if (Array.isArray(value)) return value.map(String).join(" ");
  return typeof value === "string" ? value : fallback;
}

function errorFields(error: ApiError | null | undefined): Record<string, unknown> | undefined {
  return (error?.data as { error?: { fields?: Record<string, unknown> } } | null)?.error?.fields;
}

/** Waits until the value has stopped changing for `delay` ms. */
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function ProfileEditForm() {
  const profileQuery = useGetMyProfile();
  const { t } = useI18n();
  const p = t.profileEdit;

  if (profileQuery.isLoading) {
    return (
      <PageShell>
        <p className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> {p.loading}
        </p>
      </PageShell>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <PageShell>
        <Card className="border-border shadow-sm">
          <CardContent className="p-12 text-center">
            <h2 className="mb-2 text-lg font-bold">{p.loadFailedTitle}</h2>
            <p className="mb-6 text-muted-foreground">{p.loadFailedBody}</p>
            <Button asChild variant="outline">
              <Link href="/dashboard">{p.backToDashboard}</Link>
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  const profile = profileQuery.data.data;
  // Keyed so the form re-initialises if the account changes underneath it.
  return <ProfileFields key={profile.id} profile={profile} />;
}

function ProfileFields({ profile }: { profile: UserProfile }) {
  const router = useRouter();
  const { t } = useI18n();
  const p = t.profileEdit;
  const [profileSchema] = useState(() => makeProfileSchema(t));
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [supabase] = useState(createClientSafely);
  const updateProfile = useUpdateProfile();

  const form = useForm<ProfileInput, unknown, ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: toFormValues(profile),
  });
  const { errors, dirtyFields } = form.formState;

  // --- Pictures: uploaded as soon as they're picked, saved with the form ---
  const initialPictures = { profilePic: profile.profilePic ?? null, coverPic: profile.coverPic ?? null };
  const [pictures, setPictures] = useState<Record<PictureField, string | null>>(initialPictures);
  const [uploading, setUploading] = useState<Record<PictureField, boolean>>({ profilePic: false, coverPic: false });
  const [pictureErrors, setPictureErrors] = useState<Partial<Record<PictureField, string>>>({});
  // Storage paths uploaded during this session, for cleanup.
  const sessionUploads = useRef<string[]>([]);
  const picturesBusy = uploading.profilePic || uploading.coverPic;

  const handlePicture = async (field: PictureField, file: File) => {
    const invalid = validateProfilePhoto(file, { typeNotAllowed: t.photos.profileTypeNotAllowed, tooLarge: t.photos.profileTooLarge });
    if (invalid) {
      setPictureErrors((prev) => ({ ...prev, [field]: invalid }));
      return;
    }
    if (!supabase || !user) {
      setPictureErrors((prev) => ({ ...prev, [field]: p.uploadsUnavailable }));
      return;
    }
    setPictureErrors((prev) => ({ ...prev, [field]: undefined }));
    setUploading((prev) => ({ ...prev, [field]: true }));
    try {
      const { path, url } = await uploadProfilePhoto(supabase, user.id, PICTURE_KIND[field], file);
      sessionUploads.current.push(path);
      setPictures((prev) => ({ ...prev, [field]: url }));
    } catch (error) {
      setPictureErrors((prev) => ({
        ...prev,
        [field]: error instanceof Error ? error.message : p.uploadFailed,
      }));
    } finally {
      setUploading((prev) => ({ ...prev, [field]: false }));
    }
  };

  const removePicture = (field: PictureField) => {
    setPictureErrors((prev) => ({ ...prev, [field]: undefined }));
    setPictures((prev) => ({ ...prev, [field]: null }));
  };

  // --- Username availability, checked as the user types ---
  const usernameInput = useWatch({ control: form.control, name: "username" });
  const candidate = useDebouncedValue(usernameInput.trim().toLowerCase(), 400);
  const shouldCheck = candidate !== profile.username && USERNAME_PATTERN.test(candidate);
  const usernameCheck = useCheckUsername(
    { username: candidate },
    { query: { enabled: shouldCheck, retry: false, staleTime: 30_000 } },
  );
  const usernameTaken = shouldCheck && usernameCheck.data?.data.available === false;
  const usernameStatus = !shouldCheck || errors.username
    ? null
    : usernameCheck.isFetching
      ? <span className="text-muted-foreground">{p.checking}</span>
      : usernameCheck.data?.data.available
        ? <span className="flex items-center gap-1 text-emerald-700"><Check className="h-3.5 w-3.5" /> {p.available}</span>
        : usernameTaken
          ? <span className="text-destructive">{p.taken}</span>
          : usernameCheck.error?.status === 400
            ? <span className="text-destructive">{fieldMessage(errorFields(usernameCheck.error)?.username ?? p.invalidUsername, p.invalidValue)}</span>
            : null;

  // --- Save ---
  const cleanUp = (paths: string[]) => {
    if (supabase) void removeListingPhotos(supabase, paths);
  };

  const handleCancel = () => {
    cleanUp(sessionUploads.current);
    router.push("/dashboard");
  };

  const applyServerErrors = (error: ApiError) => {
    const fields = errorFields(error);
    if (!fields) return false;
    for (const [key, value] of Object.entries(fields)) {
      if (key === "profilePic" || key === "coverPic") {
        setPictureErrors((prev) => ({ ...prev, [key]: fieldMessage(value, p.invalidValue) }));
      } else if (key in profileSchema.shape) {
        form.setError(key as FieldName, { message: fieldMessage(value, p.invalidValue) });
      }
    }
    return true;
  };

  const onSubmit = (values: ProfileValues) => {
    if (picturesBusy) {
      toast({ title: p.picturesUploading, description: p.picturesUploadingBody });
      return;
    }
    if (usernameTaken) {
      form.setError("username", { message: p.taken });
      return;
    }

    const body: UserProfileUpdate = {};
    if (dirtyFields.username && values.username !== profile.username) body.username = values.username;

    let blocked = false;
    for (const name of REQUIRED_ONCE_SET) {
      if (!dirtyFields[name]) continue;
      if (values[name]) {
        body[name] = values[name];
      } else if (profile[name]) {
        form.setError(name, { message: p.cantRemove });
        blocked = true;
      }
    }
    if (blocked) return;

    for (const name of CLEARABLE) {
      if (dirtyFields[name]) body[name] = values[name] || null;
    }
    for (const field of ["profilePic", "coverPic"] as const) {
      if (pictures[field] !== initialPictures[field]) body[field] = pictures[field];
    }

    if (Object.keys(body).length === 0) {
      toast({ title: p.noChanges });
      return;
    }

    updateProfile.mutate(
      { data: body },
      {
        onSuccess: (response) => {
          const saved = response.data;
          // Old pictures that were replaced or removed, plus uploads that
          // were superseded before saving. Only ever files in the user's
          // own profile folder — anything else isn't theirs to delete.
          const kept = new Set([saved.profilePic, saved.coverPic].filter(Boolean));
          const stale = [initialPictures.profilePic, initialPictures.coverPic]
            .filter((url): url is string => !!url && !kept.has(url))
            .map(photoPathFromUrl)
            .filter((path): path is string => !!path && !!user && path.startsWith(`${user.id}/profile/`));
          const discarded = sessionUploads.current.filter(
            (path) => ![...kept].some((url) => url && photoPathFromUrl(url) === path),
          );
          cleanUp([...stale, ...discarded]);

          queryClient.setQueryData(getGetMyProfileQueryKey(), response);
          toast({ title: p.updated, description: p.updatedBody });
          router.push(profilePath(saved.username));
          router.refresh();
        },
        onError: (error) => {
          if (error.status === 401) {
            toast({ title: p.sessionExpired, description: p.signInAgain, variant: "destructive" });
            router.push("/sign-in");
            return;
          }
          if (error.status === 409) {
            form.setError("username", { message: p.taken });
            toast({ title: p.takenTitle, variant: "destructive" });
            return;
          }
          if (error.status === 400 && applyServerErrors(error)) {
            toast({ title: p.fixFields, variant: "destructive" });
            return;
          }
          toast({ title: p.saveFailed, description: p.pleaseTryAgain, variant: "destructive" });
        },
      },
    );
  };

  const field = (name: FieldName, label: string, input: ReactNode, hint?: ReactNode) => (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      {input}
      {errors[name] ? (
        <p className="text-sm text-destructive" role="alert">{errors[name]?.message}</p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );

  const text = (name: FieldName, placeholder?: string, props: ComponentProps<typeof Input> = {}) => (
    <Input id={name} placeholder={placeholder} aria-invalid={!!errors[name]} {...props} {...form.register(name)} />
  );

  const shortBio = useWatch({ control: form.control, name: "shortBio" });
  const bio = useWatch({ control: form.control, name: "bio" });
  const name = useWatch({ control: form.control, name: "name" });

  return (
    <PageShell username={profile.username}>
      <form onSubmit={(e) => form.handleSubmit(onSubmit)(e)} noValidate>
        <Card className="mb-6 overflow-hidden border-border">
          <CardHeader className="border-b border-border bg-muted/30 pb-4">
            <CardTitle>{p.pictures}</CardTitle>
            <CardDescription>{p.picturesDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <PictureInput
              label={p.coverPicture}
              hint={p.coverHint}
              url={pictures.coverPic}
              uploading={uploading.coverPic}
              error={pictureErrors.coverPic}
              onPick={(file) => handlePicture("coverPic", file)}
              onRemove={() => removePicture("coverPic")}
              preview={(src) => (
                <div className="relative aspect-3/1 w-full overflow-hidden rounded-xl border border-border bg-muted">
                  {src ? (
                    <img src={src} alt={p.coverPreview} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{p.noCover}</div>
                  )}
                </div>
              )}
            />
            <PictureInput
              label={p.profilePicture}
              hint={p.profileHint}
              url={pictures.profilePic}
              uploading={uploading.profilePic}
              error={pictureErrors.profilePic}
              onPick={(file) => handlePicture("profilePic", file)}
              onRemove={() => removePicture("profilePic")}
              inline
              preview={(src) => (
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                  {src ? (
                    <img src={src} alt={p.profilePreview} className="h-full w-full object-cover" />
                  ) : (
                    <div aria-hidden className="flex h-full items-center justify-center font-display text-3xl text-muted-foreground">
                      {profileInitials({ name, username: profile.username })}
                    </div>
                  )}
                </div>
              )}
            />
          </CardContent>
        </Card>

        <Card className="mb-6 overflow-hidden border-border">
          <CardHeader className="border-b border-border bg-muted/30 pb-4">
            <CardTitle>{p.publicProfile}</CardTitle>
            <CardDescription>{p.publicProfileDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {field(
                "username",
                p.username,
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
                  {text("username", "username", {
                    className: "pl-7 font-mono lowercase",
                    autoCapitalize: "none",
                    autoComplete: "off",
                    spellCheck: false,
                    maxLength: 30,
                  })}
                </div>,
                usernameStatus ?? <>gpudealer.com{profilePath(candidate || profile.username)}</>,
              )}
              {field("name", p.displayName, text("name", p.displayNamePlaceholder, { autoComplete: "name" }))}
              {field("companyName", p.company, text("companyName", p.companyPlaceholder, { autoComplete: "organization" }))}
              <div className="grid grid-cols-2 gap-3">
                {field("city", p.city, text("city", p.cityPlaceholder, { autoComplete: "address-level2" }))}
                {field("country", p.country, text("country", p.countryPlaceholder, { autoComplete: "country-name" }))}
              </div>
            </div>

            {field(
              "shortBio",
              p.headline,
              text("shortBio", p.headlinePlaceholder, {
                maxLength: SHORT_BIO_MAX,
              }),
              <CharCount value={shortBio} max={SHORT_BIO_MAX} />,
            )}
            {field(
              "bio",
              p.about,
              <Textarea
                id="bio"
                rows={6}
                maxLength={BIO_MAX}
                placeholder={p.aboutPlaceholder}
                aria-invalid={!!errors.bio}
                {...form.register("bio")}
              />,
              <CharCount value={bio} max={BIO_MAX} />,
            )}
          </CardContent>
        </Card>

        <Card className="mb-6 overflow-hidden border-border">
          <CardHeader className="border-b border-border bg-muted/30 pb-4">
            <CardTitle>{p.links}</CardTitle>
            <CardDescription>{p.linksDescription}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
            {field("website", p.website, text("website", "https://example.com", { inputMode: "url", autoComplete: "url" }))}
            {field("x", "X (Twitter)", text("x", "https://x.com/username", { inputMode: "url" }))}
            {field("instagram", "Instagram", text("instagram", "https://instagram.com/username", { inputMode: "url" }))}
            {field("facebook", "Facebook", text("facebook", "https://facebook.com/username", { inputMode: "url" }))}
            {field("tiktok", "TikTok", text("tiktok", "https://tiktok.com/@username", { inputMode: "url" }))}
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={handleCancel}>
            {t.common.cancel}
          </Button>
          <Button
            variant="accent"
            type="submit"
            size="lg"
            className="px-8 font-bold"
            disabled={updateProfile.isPending || picturesBusy}
          >
            {updateProfile.isPending ? t.common.saving : picturesBusy ? p.uploadingPictures : p.saveChanges}
          </Button>
        </div>
      </form>
    </PageShell>
  );
}

function PictureInput({
  label,
  hint,
  url,
  uploading,
  error,
  onPick,
  onRemove,
  preview,
  inline = false,
}: {
  label: string;
  hint: string;
  url: string | null;
  uploading: boolean;
  error?: string;
  onPick: (file: File) => void;
  onRemove: () => void;
  preview: (src: string | null) => ReactNode;
  /** Preview beside the controls (avatar) rather than above them (cover). */
  inline?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n();
  const p = t.profileEdit;

  return (
    <div className={cn("gap-4", inline ? "flex flex-col sm:flex-row sm:items-center" : "space-y-3")}>
      <div className={cn("relative flex-none", inline ? "w-fit" : "w-full")}>
        {preview(url)}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-[inherit] bg-background/60">
            <Loader2 className="h-6 w-6 animate-spin text-foreground" aria-label={p.uploading} />
          </div>
        )}
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_PROFILE_PHOTO_TYPES}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onPick(file);
              e.target.value = "";
            }}
          />
          <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
            <ImagePlus className="mr-2 h-4 w-4" /> {url ? p.replace : p.upload}
          </Button>
          {url && (
            <Button type="button" variant="ghost" size="sm" disabled={uploading} onClick={onRemove}>
              <Trash2 className="mr-2 h-4 w-4" /> {p.remove}
            </Button>
          )}
        </div>
        {error && (
          <p className="flex items-center gap-1 text-sm text-destructive" role="alert">
            <X className="h-3.5 w-3.5 shrink-0" /> {error}
          </p>
        )}
      </div>
    </div>
  );
}

function CharCount({ value, max }: { value: string; max: number }) {
  return (
    <span className={cn("tabular-nums", value.length > max && "text-destructive")}>
      {value.length}/{max}
    </span>
  );
}

function PageShell({ username, children }: { username?: string; children: ReactNode }) {
  const { t } = useI18n();
  const p = t.profileEdit;
  return (
    <>
      <PageHeader
        eyebrow={p.eyebrow}
        title={<>{p.titleStart} <em>{p.titleEm}</em></>}
        description={p.description}
      >
        {username && (
          <Button asChild variant="outline">
            <Link href={profilePath(username)}>
              {p.viewPublic} <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </PageHeader>
      <div className="container mx-auto max-w-3xl px-4 py-12">{children}</div>
    </>
  );
}
