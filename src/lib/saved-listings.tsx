'use client';

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ApiError,
  getGetSavedListingsQueryKey,
  getSavedListings,
  saveListing,
  unsaveListing,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { signInPath } from "@/lib/auth-redirect";
import { useToast } from "@/hooks/use-toast";

// The API has no "is saved" flag on listings, so the ids of everything the
// user has saved are loaded once and kept in the query cache as a Set.
//
// The key sits under the saved-listings prefix, so invalidating
// getGetSavedListingsQueryKey() (the dashboard tab, the /saved page) also
// refreshes it, and includes the user id, so one account can never read
// another's cache entry. AuthProvider also resets every query when the user
// changes, which clears it on logout.
const SAVED_IDS_PAGE_SIZE = 100;
const SAVE_MUTATION_KEY = ["toggle-saved-listing"];

function savedIdsKey(userId: string) {
  return [...getGetSavedListingsQueryKey(), "ids", userId] as const;
}

async function fetchAllSavedIds(): Promise<Set<string>> {
  const ids = new Set<string>();
  for (let page = 1; ; page++) {
    const response = await getSavedListings({ page, limit: SAVED_IDS_PAGE_SIZE });
    for (const saved of response.data) ids.add(saved.listingId);
    if (page >= response.pagination.totalPages) return ids;
  }
}

function withId(ids: Set<string> | undefined, listingId: string, saved: boolean): Set<string> | undefined {
  if (!ids) return ids;
  const next = new Set(ids);
  if (saved) next.add(listingId);
  else next.delete(listingId);
  return next;
}

/** Ids of the signed-in user's saved listings; undefined while loading or signed out. */
export function useSavedListingIds(): Set<string> | undefined {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: savedIdsKey(user?.id ?? ""),
    queryFn: fetchAllSavedIds,
    enabled: !!user,
    staleTime: 5 * 60_000,
  });
  return user ? data : undefined;
}

// --- Finishing a save after sign-in ---------------------------------------
// localStorage (not sessionStorage) so it survives a magic link opening in a
// new tab; it expires so a stale intent can't fire days later.
const PENDING_KEY = "gpudealer:pending-save";
const PENDING_TTL_MS = 30 * 60_000;

type PendingSave = { listingId: string; save: boolean; at: number };

function rememberPendingSave(listingId: string, save: boolean) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ listingId, save, at: Date.now() } satisfies PendingSave));
  } catch {
    // Storage unavailable (private mode) — the user can just click again.
  }
}

function takePendingSave(): PendingSave | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    localStorage.removeItem(PENDING_KEY);
    const pending = raw ? (JSON.parse(raw) as PendingSave) : null;
    return pending && Date.now() - pending.at < PENDING_TTL_MS ? pending : null;
  } catch {
    return null;
  }
}

function useSendToSignIn() {
  const router = useRouter();
  const pathname = usePathname();
  return (listingId: string, save: boolean) => {
    rememberPendingSave(listingId, save);
    router.push(signInPath(`${pathname}${window.location.search}`));
  };
}

function saveErrorToast(error: unknown) {
  return error instanceof ApiError && error.status === 404
    ? { title: "This listing is no longer available", variant: "destructive" as const }
    : { title: "Couldn't update saved listings", description: "Please try again.", variant: "destructive" as const };
}

/** Optimistic save/unsave for one listing (by id — the API doesn't take slugs). */
export function useSaveToggle(listingId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const sendToSignIn = useSendToSignIn();
  const ids = useSavedListingIds();
  const key = savedIdsKey(user?.id ?? "");

  const mutation = useMutation({
    mutationKey: SAVE_MUTATION_KEY,
    mutationFn: async (save: boolean) => {
      if (save) await saveListing(listingId);
      else await unsaveListing(listingId);
    },
    onMutate: async (save) => {
      // Stop an in-flight refetch from overwriting the optimistic value.
      await queryClient.cancelQueries({ queryKey: key });
      queryClient.setQueryData<Set<string>>(key, (old) => withId(old, listingId, save));
    },
    onError: (error, save) => {
      // Undo only this listing, so concurrent toggles on other cards survive.
      queryClient.setQueryData<Set<string>>(key, (old) => withId(old, listingId, !save));
      if (error instanceof ApiError && error.status === 401) {
        sendToSignIn(listingId, save);
        return;
      }
      toast(saveErrorToast(error));
    },
    onSettled: () => {
      // Resync with the server once the last concurrent toggle finishes;
      // refetching earlier could briefly undo another card's optimistic state.
      if (queryClient.isMutating({ mutationKey: SAVE_MUTATION_KEY }) === 1) {
        void queryClient.invalidateQueries({ queryKey: getGetSavedListingsQueryKey() });
      }
    },
  });

  const isSaved = ids?.has(listingId) ?? false;

  const toggle = () => {
    if (!user) {
      sendToSignIn(listingId, true);
      return;
    }
    mutation.mutate(!isSaved);
  };

  return {
    isSaved,
    toggle,
    // Signed in but ids not loaded yet: the current state is unknown.
    isBusy: mutation.isPending || (!!user && !ids),
  };
}

/**
 * Mounted once (in Providers): after sign-in, completes the save the user
 * asked for while signed out, wherever they land.
 */
export function PendingSaveResumer() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    const pending = takePendingSave();
    if (!pending) return;
    const request: Promise<unknown> = pending.save ? saveListing(pending.listingId) : unsaveListing(pending.listingId);
    request
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: getGetSavedListingsQueryKey() });
        toast({ title: pending.save ? "Listing saved" : "Removed from saved listings" });
      })
      .catch((error) => toast(saveErrorToast(error)));
  }, [user, queryClient, toast]);

  return null;
}
