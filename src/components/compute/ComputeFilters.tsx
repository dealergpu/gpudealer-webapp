'use client';

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export type FilterField =
  | {
      kind: "select";
      name: string;
      label: string;
      options: { value: string; label: string }[];
      /** The option that means "no filter" — it's left out of the URL. */
      defaultValue: string;
    }
  | { kind: "text"; name: string; label: string; placeholder?: string; maxLength?: number };

/**
 * Filter bar for the compute pages. Every filter lives in the URL, so
 * filtered views are shareable and back/forward work; the server page reads
 * the params and refetches. Changing a filter resets to page 1.
 */
export function ComputeFilters({
  basePath,
  fields,
  values,
}: {
  basePath: string;
  fields: FilterField[];
  values: Record<string, string | undefined>;
}) {
  const id = useId();
  const router = useRouter();
  const [text, setText] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.filter((f) => f.kind === "text").map((f) => [f.name, values[f.name] ?? ""])),
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Set by "Clear filters", whose own navigation already covers the emptied text.
  const skipDebounceRef = useRef(false);

  const navigate = (changes: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    for (const field of fields) {
      const value = (field.name in changes ? changes[field.name] : values[field.name])?.trim();
      if (value && !(field.kind === "select" && value === field.defaultValue)) params.set(field.name, value);
    }
    const query = params.toString();
    router.push(query ? `${basePath}?${query}` : basePath, { scroll: false });
  };

  // Free-text filters wait for typing to pause before refetching.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (skipDebounceRef.current) {
      skipDebounceRef.current = false;
      return;
    }
    debounceRef.current = setTimeout(() => {
      const changed = Object.entries(text).filter(([name, value]) => value.trim() !== (values[name] ?? ""));
      if (changed.length > 0) navigate(Object.fromEntries(changed));
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const hasFilters = fields.some((field) => {
    const value = values[field.name];
    return value && !(field.kind === "select" && value === field.defaultValue);
  });

  return (
    <div className="grid grid-cols-2 items-end gap-3 rounded-3xl border border-border bg-card p-4 md:flex md:flex-wrap">
      {fields.map((field) => (
        <div key={field.name} className="min-w-0 space-y-1.5 md:w-44">
          <Label htmlFor={`${id}-${field.name}`} className="text-xs text-muted-foreground">
            {field.label}
          </Label>
          {field.kind === "select" ? (
            <Select value={values[field.name] ?? field.defaultValue} onValueChange={(value) => navigate({ [field.name]: value })}>
              <SelectTrigger id={`${id}-${field.name}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id={`${id}-${field.name}`}
              placeholder={field.placeholder}
              maxLength={field.maxLength}
              value={text[field.name] ?? ""}
              onChange={(e) => setText((current) => ({ ...current, [field.name]: e.target.value }))}
            />
          )}
        </div>
      ))}
      {hasFilters && (
        <Button
          variant="ghost"
          className="col-span-2 md:col-span-1"
          onClick={() => {
            skipDebounceRef.current = true;
            setText(Object.fromEntries(Object.keys(text).map((name) => [name, ""])));
            router.push(basePath, { scroll: false });
          }}
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
