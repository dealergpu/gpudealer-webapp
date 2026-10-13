import Link from "next/link";
import { notFound } from "next/navigation";
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
import { getListing, ListingCondition, ListingSourceType, type Listing } from "@/lib/api";
import { ListingActions } from "@/components/listing/ListingActions";
import { ListingGallery } from "@/components/listing/ListingGallery";

function sortedImages(listing: Listing) {
  return [...(listing.images ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

async function loadListing(id: string): Promise<Listing | null> {
  try {
    const response = await getListing(id);
    return response.data;
  } catch {
    return null;
  }
}

function formatLocation(listing: Listing): string | null {
  return [listing.locationCity, listing.locationRegion, listing.locationCountry]
    .filter(Boolean)
    .join(", ") || null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await loadListing(id);

  if (!listing) {
    return { title: "Listing" };
  }

  const description = listing.description
    ? listing.description.slice(0, 160)
    : `${listing.manufacturer ?? ""} ${listing.model ?? listing.title} — ${listing.condition}, listed on GPUDealer.`.trim();

  const coverImage = sortedImages(listing)[0]?.url;

  return {
    title: listing.title,
    description,
    openGraph: {
      title: listing.title,
      description,
      type: "website",
      images: coverImage ? [coverImage] : undefined,
    },
    twitter: {
      card: coverImage ? "summary_large_image" : "summary",
      title: listing.title,
      description,
      images: coverImage ? [coverImage] : undefined,
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
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await loadListing(id);

  if (!listing) {
    notFound();
  }

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: listing.currency || "USD",
  }).format(Number(listing.price));

  const location = formatLocation(listing);
  const isThirdParty = listing.sourceType && listing.sourceType !== ListingSourceType.GPUDEALER;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Link href="/gpus" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to search
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="outline" className="font-mono text-xs uppercase bg-secondary/50">
                {listing.category}
              </Badge>
              {listing.condition === ListingCondition.NEW && <Badge variant="success" className="uppercase text-xs">New</Badge>}
              {listing.condition === ListingCondition.REFURBISHED && <Badge variant="warning" className="uppercase text-xs bg-orange-500 text-white">Refurbished</Badge>}
              {listing.condition === ListingCondition.USED && <Badge variant="secondary" className="uppercase text-xs">Used</Badge>}

              {isThirdParty && (
                <Badge variant="outline" className="uppercase text-xs">
                  via {listing.sourceType}
                </Badge>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-foreground font-heading mb-4 leading-tight">
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
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 font-heading border-b border-border pb-2">Description</h2>
              <div className="prose prose-sm sm:prose-base max-w-none text-foreground whitespace-pre-wrap">
                {listing.description}
              </div>
            </div>
          )}

          {/* Technical Specs */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="bg-muted/30 px-6 py-4 border-b border-border">
              <h2 className="text-xl font-bold font-heading">Technical Specifications</h2>
            </div>
            <Table>
              <TableBody>
                {listing.manufacturer && (
                  <TableRow>
                    <TableCell className="w-1/3 font-medium text-muted-foreground bg-muted/10">Manufacturer</TableCell>
                    <TableCell className="font-medium">{listing.manufacturer}</TableCell>
                  </TableRow>
                )}
                {listing.model && (
                  <TableRow>
                    <TableCell className="font-medium text-muted-foreground bg-muted/10">Model</TableCell>
                    <TableCell className="font-medium">{listing.model}</TableCell>
                  </TableRow>
                )}
                {listing.gpuModel && (
                  <TableRow>
                    <TableCell className="font-medium text-muted-foreground bg-muted/10">GPU Model</TableCell>
                    <TableCell className="font-medium">{listing.gpuModel}</TableCell>
                  </TableRow>
                )}
                {listing.vramGb != null && (
                  <TableRow>
                    <TableCell className="font-medium text-muted-foreground bg-muted/10 flex items-center gap-2">
                      <Zap className="h-4 w-4" /> VRAM
                    </TableCell>
                    <TableCell className="font-mono">{listing.vramGb} GB</TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground bg-muted/10">Quantity Available</TableCell>
                  <TableCell>{listing.quantity ?? 1}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Sidebar Panel */}
        <div className="space-y-6">
          <Card className="border-border sticky top-24 shadow-sm overflow-hidden">
            <div className="bg-primary p-6 text-primary-foreground text-center">
              <p className="text-sm font-medium opacity-80 uppercase tracking-widest mb-1">Asking Price</p>
              <h3 className="text-4xl font-bold font-mono tracking-tight">{formattedPrice}</h3>
              {listing.quantity != null && listing.quantity > 1 && (
                <p className="text-sm mt-2 font-medium bg-white/10 inline-block px-3 py-1 rounded-full">
                  Qty Available: {listing.quantity}
                </p>
              )}
            </div>

            <CardContent className="p-6 space-y-4">
              {isThirdParty && listing.sourceUrl ? (
                <Button className="w-full h-12 text-base font-bold" asChild>
                  <a href={listing.sourceUrl} target="_blank" rel="noopener noreferrer">
                    View Original Listing
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              ) : (
                <ListingActions listing={listing} />
              )}

              <Link href="/request">
                <Button variant="outline" className="w-full h-12 text-base font-semibold border-border">
                  Request Similar Hardware
                </Button>
              </Link>
            </CardContent>

            <div className="bg-muted/30 p-4 border-t border-border flex items-center gap-3">
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

          <Card className="bg-secondary/30 border-transparent">
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
