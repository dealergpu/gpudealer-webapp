import { fmt } from "@/i18n/format";
import type { Messages } from "@/i18n/messages";

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

type RelativeLabels = Pick<Messages["comments"], "justNow" | "minutesAgo" | "hoursAgo" | "daysAgo" | "weeksAgo">;

/** "just now", "5m ago", "3h ago", "2d ago", "3w ago", then a date (labels come from the locale file). */
export function relativeTime(iso: string, labels: RelativeLabels, intl = "en-US", now = Date.now()): string {
  const date = new Date(iso);
  const elapsed = Math.max(0, now - date.getTime());
  if (elapsed < MINUTE) return labels.justNow;
  if (elapsed < HOUR) return fmt(labels.minutesAgo, { n: Math.floor(elapsed / MINUTE) });
  if (elapsed < DAY) return fmt(labels.hoursAgo, { n: Math.floor(elapsed / HOUR) });
  if (elapsed < WEEK) return fmt(labels.daysAgo, { n: Math.floor(elapsed / DAY) });
  if (elapsed < 5 * WEEK) return fmt(labels.weeksAgo, { n: Math.floor(elapsed / WEEK) });
  return date.toLocaleDateString(intl, {
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== new Date(now).getFullYear() ? { year: "numeric" } : {}),
  });
}

export function fullTimestamp(iso: string, intl = "en-US"): string {
  return new Date(iso).toLocaleString(intl, { dateStyle: "medium", timeStyle: "short" });
}

/** Appends `incoming` to `existing`, skipping anything already present by id. */
export function appendUnique<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const seen = new Set(existing.map((item) => item.id));
  return [...existing, ...incoming.filter((item) => !seen.has(item.id))];
}
