import Link from "next/link";
import { Listing, ListingCondition, ListingSourceType } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, MapPin } from "lucide-react";
import { listingPath } from "@/lib/listing-path";

// Shown on cards when a listing has no photos. Not used on the detail page.
const DEFAULT_LISTING_IMAGE = "/gpu-default-listing-image.png";

interface ListingCardProps {
  listing: Listing;
}

function formatLocation(listing: Listing): string | null {
  return [listing.locationCity, listing.locationRegion, listing.locationCountry]
    .filter(Boolean)
    .join(", ") || null;
}

const CONDITION_BADGE: Record<string, { label: string; variant: "success" | "warning" | "secondary" }> = {
  [ListingCondition.NEW]: { label: "New", variant: "success" },
  [ListingCondition.REFURBISHED]: { label: "Refurb", variant: "warning" },
  [ListingCondition.USED]: { label: "Used", variant: "secondary" },
};

export function ListingCard({ listing }: ListingCardProps) {
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: listing.currency || "USD",
    maximumFractionDigits: 0,
  }).format(Number(listing.price));

  const location = formatLocation(listing);
  const coverImage = [...(listing.images ?? [])].filter((image) => image.url).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0];
  const condition = listing.condition ? CONDITION_BADGE[listing.condition] : undefined;
  const isThirdParty = listing.sourceType && listing.sourceType !== ListingSourceType.GPUDEALER;
  const specs = [
    listing.vramGb != null ? `${listing.vramGb}GB VRAM` : null,
    listing.quantity != null && listing.quantity > 1 ? `${listing.quantity} available` : null,
  ].filter(Boolean);

  return (
    <article className="group card-hover relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="relative aspect-4/3 overflow-hidden bg-muted">
        {coverImage ? (
          <img
            src={coverImage.url}
            alt={coverImage.altText || listing.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
          />
        ) : (
          // Square artwork on white — contained (not cropped) so the whole card shows.
          <img
            src={DEFAULT_LISTING_IMAGE}
            alt=""
            loading="lazy"
            className="h-full w-full bg-white object-contain px-4 pt-8 pb-2 transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
          />
        )}
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <span className="rounded-full bg-background/85 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground backdrop-blur">
            {listing.category}
          </span>
          {condition && (
            <Badge variant={condition.variant} className="bg-background/85 backdrop-blur">
              {condition.label}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-foreground">
          {/* Stretched link: the whole card is clickable, but only one focus stop. */}
          <Link href={listingPath(listing)} className="after:absolute after:inset-0 focus-visible:outline-none">
            {listing.title}
          </Link>
        </h3>
        {(listing.manufacturer || listing.model) && (
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {[listing.manufacturer, listing.model].filter(Boolean).join(" ")}
          </p>
        )}

        {specs.length > 0 && (
          <p className="mt-3 font-mono text-xs text-foreground/80">{specs.join(" · ")}</p>
        )}
        {location && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{location}</span>
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <p className="text-xl font-semibold tracking-tight tabular-nums">{formattedPrice}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {isThirdParty ? `via ${listing.sourceType}` : "Seller listing"}
            </p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-500 group-hover:border-transparent group-hover:bg-foreground group-hover:text-background">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </article>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="aspect-4/3 animate-pulse bg-muted" />
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-muted" />
        <div className="mt-6 flex items-end justify-between">
          <div className="h-6 w-20 animate-pulse rounded bg-muted" />
          <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}
