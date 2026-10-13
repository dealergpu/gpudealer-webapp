"use client";

import { useState } from "react";
import type { ListingImage } from "@/lib/api";

type ListingGalleryProps = {
  images: ListingImage[];
  title: string;
};

export function ListingGallery({ images, title }: ListingGalleryProps) {
  const [selected, setSelected] = useState(0);

  if (images.length === 0) return null;

  const current = images[selected] ?? images[0];

  return (
    <div className="space-y-3">
      <div className="aspect-[4/3] bg-muted/40 border border-border rounded-lg overflow-hidden">
        <img
          src={current.url}
          alt={current.altText || title}
          className="h-full w-full object-contain"
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={image.id ?? image.url}
              type="button"
              onClick={() => setSelected(index)}
              aria-label={`Show photo ${index + 1} of ${images.length}`}
              aria-current={index === selected}
              className={`h-16 w-20 shrink-0 rounded border overflow-hidden bg-muted/40 ${
                index === selected ? "border-primary ring-2 ring-primary/30" : "border-border opacity-70 hover:opacity-100"
              }`}
            >
              <img src={image.url} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
