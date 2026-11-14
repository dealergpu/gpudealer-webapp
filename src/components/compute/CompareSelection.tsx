'use client';

import { useId } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Scale, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { COMPARE_MAX, compareHref, useCompareSelection, type CompareItem } from "@/lib/compute-compare";
import { cn } from "@/lib/utils";

/** "Compare" checkbox on a table row or card. */
export function CompareToggle({ item, className }: { item: CompareItem; className?: string }) {
  const id = useId();
  const { isSelected, isFull, toggle } = useCompareSelection();
  const checked = isSelected(item.id);
  const disabled = !checked && isFull;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={() => toggle(item)}
        aria-label={`Compare ${item.label}`}
        title={disabled ? `You can compare up to ${COMPARE_MAX} offerings` : undefined}
      />
      <label htmlFor={id} aria-hidden className={cn("text-xs text-muted-foreground", disabled ? "cursor-not-allowed" : "cursor-pointer")}>
        Compare
      </label>
    </div>
  );
}

/** Sticky tray listing the picked offerings, with the link to the compare page. */
export function CompareTray() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { selected, remove, clear } = useCompareSelection();
  if (selected.length === 0) return null;

  const href = compareHref(selected.map((item) => item.id));
  const onCurrentComparison = pathname === "/compute/compare" && searchParams.get("ids") === selected.map((item) => item.id).join(",");

  return (
    <aside
      aria-label="Comparison selection"
      className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-3xl rounded-2xl border border-border bg-background/95 p-3 shadow-[0_18px_50px_-20px_hsl(240_10%_4%/0.45)] backdrop-blur-xl sm:inset-x-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <ul className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {selected.map((item) => (
            <li key={item.id} className="flex shrink-0 items-center gap-1 rounded-full border border-border bg-card py-1 pl-3 pr-1 text-xs">
              <span className="max-w-44 truncate">{item.label}</span>
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="rounded-full p-0.5 text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                aria-label={`Remove ${item.label} from comparison`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="ghost" size="sm" onClick={clear}>
            Clear
          </Button>
          {selected.length < 2 ? (
            <p className="text-xs text-muted-foreground">Pick one more to compare</p>
          ) : onCurrentComparison ? (
            <p className="text-xs text-muted-foreground">Showing this comparison</p>
          ) : (
            <Button asChild size="sm">
              <Link href={href}>
                <Scale className="h-4 w-4" />
                Compare {selected.length}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
