import Link from "next/link";
import { cache } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import {
  Zap,
  MapPin, Clock, ExternalLink, ShieldCheck, User,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { ApiError, getListing, ListingCondition, ListingSourceType, type Listing } from "@/lib/api";
import { getAccessToken } from "@/lib/supabase/server";
import { listingPath } from "@/lib/listing-path";
import { formatListingPrice, hasListingPrice } from "@/lib/listing-price";
import { ListingActions } from "@/components/listing/ListingActions";
import { ListingGallery } from "@/components/listing/ListingGallery";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL } from "@/lib/site";

function sortedImages(listing: Listing) {
  return [...(listing.images ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

// The API resolves both slugs and ids. The viewer's token is forwarded so
// sellers can preview their own drafts. Cached per request so metadata and
// the page share one fetch.
const loadListing = cache(async (slugOrId: string): Promise<Listing | null> => {
  const token = await getAccessToken();
  try {
    const response = await getListing(slugOrId, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
});

function formatLocation(listing: Listing): string | null {
  return [listing.locationCity, listing.locationRegion, listing.locationCountry]
    .filter(Boolean)
    .join(", ") || null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const listing = await loadListing(slug);

  if (!listing) {
    return { title: "Listing not found", robots: { index: false } };
  }

  const price = formatListingPrice(listing, 0);
  const title = `${listing.title} — ${price}`;
  const hardware = [listing.manufacturer, listing.model].filter(Boolean).join(" ");
  const location = formatLocation(listing);
  const description = [
    `${listing.title}${hardware && !listing.title.includes(hardware) ? ` (${hardware})` : ""}${hasListingPrice(listing) ? ` for ${price}` : ""}`,
    [
      listing.vramGb != null ? `${listing.vramGb}GB VRAM` : null,
      listing.condition !== ListingCondition.UNKNOWN ? listing.condition.toLowerCase() : null,
      listing.quantity != null && listing.quantity > 1 ? `${listing.quantity} available` : null,
      location,
    ].filter(Boolean).join(", "),
  ].filter(Boolean).join(". ") + " — on GPUDealer.";

  const coverImage = listing.images?.[0]?.url;
  const canonical = `${SITE_URL}${listingPath(listing)}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      images: coverImage ? [{ url: coverImage, alt: listing.images?.[0]?.altText || listing.title }] : undefined,
    },
    twitter: {
      card: coverImage ? "summary_large_image" : "summary",
      title,
      description,
      images: coverImage ? [coverImage] : undefined,
    },
  };
}

const ITEM_CONDITION: Partial<Record<string, string>> = {
  [ListingCondition.NEW]: "https://schema.org/NewCondition",
  [ListingCondition.USED]: "https://schema.org/UsedCondition",
  [ListingCondition.REFURBISHED]: "https://schema.org/RefurbishedCondition",
};

function productStructuredData(listing: Listing) {
  const url = `${SITE_URL}${listingPath(listing)}`;
  const vram = listing.vramGb != null ? `${listing.vramGb}GB VRAM` : null;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    url,
    description: listing.description || [listing.manufacturer, listing.model, vram].filter(Boolean).join(" "),
    image: sortedImages(listing).map((image) => image.url),
    ...(listing.manufacturer ? { brand: { "@type": "Brand", name: listing.manufacturer } } : {}),
    ...(listing.model ? { model: listing.model } : {}),
    category: listing.category,
    ...(vram ? { additionalProperty: [{ "@type": "PropertyValue", name: "VRAM", value: listing.vramGb, unitText: "GB" }] } : {}),
    offers: {
      "@type": "Offer",
      url,
      ...(hasListingPrice(listing) ? { price: Number(listing.price), priceCurrency: listing.currency || "USD" } : {}),
      availability: "https://schema.org/InStock",
      ...(ITEM_CONDITION[listing.condition] ? { itemCondition: ITEM_CONDITION[listing.condition] } : {}),
      ...(listing.quantity != null ? { inventoryLevel: { "@type": "QuantitativeValue", value: listing.quantity } } : {}),
    },
  };
}

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export default async function ListingDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const listing = await loadListing(slug);

  if (!listing) {
    notFound();
  }

  // Old /listing/<uuid> links (and any other non-canonical param) land on
  // the slug URL with a permanent redirect so search engines update.
  if (decodeURIComponent(slug) !== listing.slug) {
    permanentRedirect(listingPath(listing));
  }

  const formattedPrice = formatListingPrice(listing);

  const location = formatLocation(listing);
  const isThirdParty = listing.sourceType && listing.sourceType !== ListingSourceType.GPUDEALER;

  return (
    <div className="container mx-auto max-w-6xl px-4 pt-28 pb-20 sm:px-6">
      <JsonLd data={productStructuredData(listing)} />
      <Link href="/gpus" className="group mb-8 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ChevronLeft className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back to search
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-[0.12em]">
                {listing.category}
              </Badge>
              {listing.condition === ListingCondition.NEW && <Badge variant="success" className="uppercase text-xs">New</Badge>}
              {listing.condition === ListingCondition.REFURBISHED && <Badge variant="warning" className="uppercase text-xs">Refurbished</Badge>}
              {listing.condition === ListingCondition.USED && <Badge variant="secondary" className="uppercase text-xs">Used</Badge>}

              {isThirdParty && (
                <Badge variant="outline" className="uppercase text-xs">
                  via {listing.sourceType}
                </Badge>
              )}
            </div>

            <h1 className="mb-4 font-display text-4xl leading-[1.02] tracking-[-0.01em] text-balance text-foreground sm:text-6xl">
              {listing.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{location}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Listed {formatDate(listing.createdAt)}</span>
              </div>
            </div>
          </div>

          <ListingGallery images={sortedImages(listing)} title={listing.title} />

          {/* Description */}
          {listing.description && (
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="mb-4 font-display text-3xl">Description</h2>
              <div className="prose prose-sm sm:prose-base max-w-none text-foreground whitespace-pre-wrap">
                {listing.description}
              </div>
            </div>
          )}

          {/* Technical Specs */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-6 py-5 sm:px-8">
              <h2 className="font-display text-3xl">Specifications</h2>
            </div>
            <Table>
              <TableBody>
                {listing.manufacturer && (
                  <TableRow>
                    <TableCell className="w-1/3 pl-6 text-muted-foreground sm:pl-8">Manufacturer</TableCell>
                    <TableCell className="font-medium">{listing.manufacturer}</TableCell>
                  </TableRow>
                )}
                {listing.model && (
                  <TableRow>
                    <TableCell className="pl-6 text-muted-foreground sm:pl-8">Model</TableCell>
                    <TableCell className="font-medium">{listing.model}</TableCell>
                  </TableRow>
                )}
                {listing.gpuModel && (
                  <TableRow>
                    <TableCell className="pl-6 text-muted-foreground sm:pl-8">GPU Model</TableCell>
                    <TableCell className="font-medium">{listing.gpuModel}</TableCell>
                  </TableRow>
                )}
                {listing.vramGb != null && (
                  <TableRow>
                    <TableCell className="flex items-center gap-2 pl-6 text-muted-foreground sm:pl-8">
                      <Zap className="h-4 w-4" /> VRAM
                    </TableCell>
                    <TableCell className="font-mono">{listing.vramGb} GB</TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell className="pl-6 text-muted-foreground sm:pl-8">Quantity Available</TableCell>
                  <TableCell>{listing.quantity ?? 1}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Sidebar Panel */}
        <div className="space-y-6">
          <Card className="dark sticky top-28 overflow-hidden rounded-3xl border-border bg-background text-foreground shadow-[0_30px_80px_-30px_hsl(240_10%_4%/0.6)]">
            <div className="relative p-6 sm:p-7">
              <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(closest-side,hsl(357_90%_50%/0.35),transparent)] blur-2xl" />
              <p className="relative mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Asking price</p>
              <p className="relative font-display text-6xl leading-none tracking-[-0.02em] tabular-nums">{formattedPrice}</p>
              {listing.quantity != null && listing.quantity > 1 && (
                <p className="relative mt-4 inline-block rounded-full border border-white/10 px-3 py-1 font-mono text-xs text-muted-foreground">
                  Qty Available: {listing.quantity}
                </p>
              )}
            </div>

            <CardContent className="space-y-3 p-6 pt-0 sm:px-7">
              {isThirdParty && listing.sourceUrl ? (
                <Button variant="accent" className="h-12 w-full text-base" asChild>
                  <a href={listing.sourceUrl} target="_blank" rel="noopener noreferrer">
                    View Original Listing
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              ) : (
                <ListingActions listing={listing} />
              )}

              <Button asChild variant="outline" className="h-12 w-full text-base">
                <Link href="/request">Request Similar Hardware</Link>
              </Button>
            </CardContent>

            <div className="flex items-center gap-3 border-t border-border px-6 py-4 sm:px-7">
              <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Listed via</p>
                <p className="font-semibold text-sm truncate">
                  {isThirdParty ? listing.sourceType : "GPUDealer Seller"}
                </p>
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border-border bg-secondary/50">
            <CardContent className="p-5 flex items-start gap-3">
              <ShieldCheck className="h-6 w-6 text-accent shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm mb-1">Trust & Safety</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Never wire money directly for high-value hardware. Use escrow services for transactions over $10,000.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
