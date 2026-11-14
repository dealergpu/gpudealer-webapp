'use client';

import { useSyncExternalStore } from "react";

// Offerings picked for /compute/compare. Kept in localStorage so a selection
// survives moving between the GPU cloud, inference and provider pages; the
// compare page itself reads the ids from its URL, so links stay shareable.

export type CompareItem = { id: string; label: string };

/** The API compares at most 10 offerings at once. */
export const COMPARE_MAX = 10;

const STORAGE_KEY = "gpudealer:compute-compare";
const EMPTY: CompareItem[] = [];

let items: CompareItem[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function isItem(value: unknown): value is CompareItem {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as CompareItem).id === "string" &&
    typeof (value as CompareItem).label === "string"
  );
}

function read(): CompareItem[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isItem).slice(0, COMPARE_MAX) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function emit() {
  listeners.forEach((listener) => listener());
}

function write(next: CompareItem[]) {
  items = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage blocked (private mode etc.) — the selection still works for this page view.
  }
  emit();
}

function onStorage(event: StorageEvent) {
  if (event.key !== STORAGE_KEY) return;
  items = read();
  emit();
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  if (!loaded) {
    loaded = true;
    items = read();
  }
  return items;
}

export function compareHref(ids: string[]): string {
  return `/compute/compare?ids=${ids.join(",")}`;
}

export function useCompareSelection() {
  const selected = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);

  return {
    selected,
    isFull: selected.length >= COMPARE_MAX,
    isSelected: (id: string) => selected.some((item) => item.id === id),
    toggle: (item: CompareItem) => {
      const current = getSnapshot();
      if (current.some((existing) => existing.id === item.id)) {
        write(current.filter((existing) => existing.id !== item.id));
      } else if (current.length < COMPARE_MAX) {
        write([...current, item]);
      }
    },
    remove: (id: string) => write(getSnapshot().filter((item) => item.id !== id)),
    clear: () => write(EMPTY),
  };
}
