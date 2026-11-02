// Page sizes match the API's defaults: the first page of comments embeds
// each thread's first REPLIES_PAGE_SIZE replies, so "See more replies"
// starts at page 2 of the replies endpoint.
export const COMMENTS_PAGE_SIZE = 10;
export const REPLIES_PAGE_SIZE = 5;
export const COMMENT_MAX_LENGTH = 2000;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/** "just now", "5m ago", "3h ago", "2d ago", "3w ago", then a date. */
export function relativeTime(iso: string, now = Date.now()): string {
  const date = new Date(iso);
  const elapsed = Math.max(0, now - date.getTime());
  if (elapsed < MINUTE) return "just now";
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m ago`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h ago`;
  if (elapsed < WEEK) return `${Math.floor(elapsed / DAY)}d ago`;
  if (elapsed < 5 * WEEK) return `${Math.floor(elapsed / WEEK)}w ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== new Date(now).getFullYear() ? { year: "numeric" } : {}),
  });
}

export function fullTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

/** Appends `incoming` to `existing`, skipping anything already present by id. */
export function appendUnique<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const seen = new Set(existing.map((item) => item.id));
  return [...existing, ...incoming.filter((item) => !seen.has(item.id))];
}
