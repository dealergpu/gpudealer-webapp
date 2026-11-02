import Link from "next/link";
import { cache } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { Building2, CalendarDays, Globe, MapPin } from "lucide-react";
import { FaFacebook, FaInstagram, FaTiktok, FaXTwitter } from "react-icons/fa6";
import type { IconType } from "react-icons";
import { ApiError, getPublicProfile, type PublicProfileResponse, type PublicUser } from "@/lib/api";
import { ListingCard } from "@/components/ListingCard";
import { OwnProfileActions } from "@/components/profile/OwnProfileActions";
import { JsonLd } from "@/components/seo/JsonLd";
import { Button } from "@/components/ui/button";
import {
  USERNAME_PATTERN,
  profileDisplayName,
  profileInitials,
  profileLocation,
  profilePath,
} from "@/lib/profile";
import { SITE_URL } from "@/lib/site";

const PAGE_SIZE = 24;

type Params = Promise<{ username: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function parsePage(value: string | string[] | undefined): number {
  const page = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(page) && page > 1 ? page : 1;
}

// Cached per request so metadata and the page share one fetch. Anything that
// can't be a username is a 404 without calling the API — the generated
// client puts the param straight into the URL path.
const loadProfile = cache(async (username: string, page: number): Promise<PublicProfileResponse | null> => {
  if (!USERNAME_PATTERN.test(username)) return null;
  try {
    return await getPublicProfile(username, { page, limit: PAGE_SIZE });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
});

const SOCIAL_LINKS: { key: "website" | "x" | "instagram" | "facebook" | "tiktok"; label: string; icon: IconType | typeof Globe }[] = [
  { key: "website", label: "Website", icon: Globe },
  { key: "x", label: "X", icon: FaXTwitter },
  { key: "instagram", label: "Instagram", icon: FaInstagram },
  { key: "facebook", label: "Facebook", icon: FaFacebook },
  { key: "tiktok", label: "TikTok", icon: FaTiktok },
];

function socialLinks(user: PublicUser) {
  return SOCIAL_LINKS.flatMap((link) => {
    const href = user[link.key];
    return href ? [{ ...link, href }] : [];
  });
}

function profileDescription(user: PublicUser, total: number): string {
  const intro = user.shortBio || user.bio?.slice(0, 155);
  const listings = `${total} ${total === 1 ? "listing" : "listings"} on GPUDealer`;
  return [intro, listings].filter(Boolean).join(" — ") + ".";
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await loadProfile(decodeURIComponent(username).toLowerCase(), parsePage((await searchParams).page));

  if (!profile) {
    return { title: "Profile not found", robots: { index: false } };
  }

  const { user } = profile.data;
  const title = `${profileDisplayName(user)} (@${user.username})`;
  const description = profileDescription(user, profile.pagination.total);
  const canonical = `${SITE_URL}${profilePath(user.username)}`;
  const image = user.profilePic || user.coverPic;
  // Profiles with nothing on them are thin pages — keep them out of the index.
  const hasContent = profile.pagination.total > 0 || !!user.bio || !!user.shortBio;

  return {
    title,
    description,
    alternates: { canonical },
    robots: hasContent ? undefined : { index: false, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "profile",
      username: user.username,
      ...(image ? { images: [{ url: image, alt: profileDisplayName(user) }] } : {}),
    },
    twitter: {
      card: "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

function profileStructuredData(user: PublicUser) {
  const sameAs = socialLinks(user).map((link) => link.href);
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: `${SITE_URL}${profilePath(user.username)}`,
    dateCreated: user.createdAt,
    mainEntity: {
      "@type": "Person",
      name: profileDisplayName(user),
      alternateName: user.username,
      ...(user.shortBio || user.bio ? { description: user.shortBio || user.bio } : {}),
      ...(user.profilePic ? { image: user.profilePic } : {}),
      ...(user.companyName ? { worksFor: { "@type": "Organization", name: user.companyName } } : {}),
      ...(sameAs.length ? { sameAs } : {}),
    },
  };
}

const formatMonth = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", { month: "long", year: "numeric" });

export default async function UserProfilePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { username } = await params;
  const page = parsePage((await searchParams).page);
  const requested = decodeURIComponent(username);
  const profile = await loadProfile(requested.toLowerCase(), page);

  if (!profile) {
    notFound();
  }

  const { user, listings } = profile.data;
  const { pagination } = profile;

  // Usernames are case-insensitive; keep one canonical URL per profile.
  if (requested !== user.username) {
    permanentRedirect(`${profilePath(user.username)}${page > 1 ? `?page=${page}` : ""}`);
  }

  const displayName = profileDisplayName(user);
  const location = profileLocation(user);
  const links = socialLinks(user);
  const pageHref = (target: number) => `${profilePath(user.username)}${target > 1 ? `?page=${target}` : ""}`;

  return (
    <>
      <JsonLd data={profileStructuredData(user)} />

      <header data-nav="dark" className="dark relative h-56 overflow-hidden bg-background text-foreground sm:h-72 md:h-80">
        {user.coverPic ? (
          <>
            <img src={user.coverPic} alt="" className="absolute inset-0 h-full w-full object-cover" />
            {/* Keeps the navbar legible over bright cover photos. */}
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 to-transparent" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_60%_100%_at_20%_0%,black,transparent)]" />
            <div className="pointer-events-none absolute -top-1/2 right-[-10%] h-[160%] w-[55%] rounded-full bg-[radial-gradient(closest-side,hsl(357_90%_50%/0.22),hsl(25_95%_55%/0.06)_60%,transparent)] blur-2xl" />
            <div className="bg-noise pointer-events-none absolute inset-0" />
          </>
        )}
      </header>

      <div className="container mx-auto px-4 pb-20 sm:px-6 lg:px-8">
        <section aria-label="Profile" className="relative -mt-14 sm:-mt-16">
          {/* Only the avatar overlaps the cover; the name sits fully below it. */}
          <div className="flex items-end justify-between gap-4">
            <div className="h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-background bg-muted sm:h-32 sm:w-32">
              {user.profilePic ? (
                <img src={user.profilePic} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <div aria-hidden className="flex h-full w-full items-center justify-center font-display text-4xl text-muted-foreground">
                  {profileInitials(user)}
                </div>
              )}
            </div>
            <OwnProfileActions username={user.username} />
          </div>
          <div className="mt-4 min-w-0">
            <h1 className="font-display text-4xl leading-tight tracking-[-0.01em] text-balance sm:text-5xl">{displayName}</h1>
            <p className="font-mono text-sm text-muted-foreground">@{user.username}</p>
          </div>

          {user.shortBio && <p className="mt-5 max-w-2xl text-base text-foreground/90 md:text-lg">{user.shortBio}</p>}

          <ul className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {user.companyName && (
              <li className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4" aria-hidden /> {user.companyName}
              </li>
            )}
            {location && (
              <li className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" aria-hidden /> {location}
              </li>
            )}
            <li className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" aria-hidden /> Member since {formatMonth(user.createdAt)}
            </li>
          </ul>

          {links.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Links">
              {links.map(({ key, label, href, icon: Icon }) => (
                <li key={key}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer nofollow ugc"
                    className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        {user.bio && (
          <section aria-labelledby="about-heading" className="mt-10 max-w-3xl rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 id="about-heading" className="mb-3 font-display text-3xl">About</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground sm:text-base">{user.bio}</p>
          </section>
        )}

        <section aria-labelledby="listings-heading" className="mt-12">
          <div className="mb-6 flex items-baseline justify-between gap-4">
            <h2 id="listings-heading" className="font-display text-3xl">Listings</h2>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground tabular-nums">{pagination.total.toLocaleString("en-US")}</span>{" "}
              {pagination.total === 1 ? "listing" : "listings"}
            </p>
          </div>

          {listings.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-3">
                  {page > 1 && (
                    <Button asChild variant="outline">
                      <Link href={pageHref(page - 1)}>Previous</Link>
                    </Button>
                  )}
                  <span className="px-2 font-mono text-xs text-muted-foreground">
                    {page} / {pagination.totalPages}
                  </span>
                  {page < pagination.totalPages && (
                    <Button asChild variant="outline">
                      <Link href={pageHref(page + 1)}>Next</Link>
                    </Button>
                  )}
                </nav>
              )}
            </>
          ) : (
            <div className="rounded-3xl border border-border bg-card px-6 py-16 text-center">
              <p className="font-display text-3xl">
                {page > 1 ? "No more listings." : "No public listings yet."}
              </p>
              <p className="mt-2 text-muted-foreground">
                {page > 1 ? (
                  <Link href={pageHref(1)} className="underline underline-offset-4 hover:text-foreground">
                    Back to the first page
                  </Link>
                ) : (
                  <>Browse the marketplace, or tell us what you need and we&apos;ll help source it.</>
                )}
              </p>
              {page === 1 && (
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Button asChild variant="outline">
                    <Link href="/gpus">Browse hardware</Link>
                  </Button>
                  <Button asChild variant="accent">
                    <Link href="/request">Request Hardware</Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
