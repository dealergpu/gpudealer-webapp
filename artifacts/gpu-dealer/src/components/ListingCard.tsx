import { Link } from "wouter";
import { Listing } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Server, Zap, Cpu, CheckCircle } from "lucide-react";

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  // Format price
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: listing.currency || "USD",
    maximumFractionDigits: 0,
  }).format(listing.price);

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow group border-border">
      <CardHeader className="pb-3 border-b border-border/50 p-4">
        <div className="flex justify-between items-start gap-2 mb-2">
          <Badge variant="outline" className="font-mono text-[10px] uppercase bg-secondary/50">
            {listing.category}
          </Badge>
          <div className="flex gap-1">
            {listing.condition === "new" && (
              <Badge variant="success" className="text-[10px] uppercase px-1.5 h-5">New</Badge>
            )}
            {listing.condition === "refurbished" && (
              <Badge variant="warning" className="text-[10px] uppercase px-1.5 h-5 bg-orange-500 text-white border-transparent">Refurb</Badge>
            )}
            {listing.condition === "used" && (
              <Badge variant="secondary" className="text-[10px] uppercase px-1.5 h-5">Used</Badge>
            )}
          </div>
        </div>
        <h3 className="text-base font-bold leading-tight line-clamp-2 text-foreground group-hover:text-accent transition-colors">
          <Link href={`/listing/${listing.id}`}>
            {listing.title}
          </Link>
        </h3>
      </CardHeader>
      
      <CardContent className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-mono bg-muted/30 p-2 rounded border border-border/50">
          <Server className="h-4 w-4 shrink-0 text-foreground" />
          <span className="truncate">{listing.manufacturer} {listing.model || "Hardware"}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-auto">
          {listing.vram != null && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Zap className="h-3.5 w-3.5 shrink-0" />
              <span>{listing.vram}GB VRAM</span>
            </div>
          )}
          {listing.quantity != null && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Cpu className="h-3.5 w-3.5 shrink-0" />
              <span>Qty: {listing.quantity}</span>
            </div>
          )}
          {listing.location && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground col-span-2">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{listing.location}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-3 flex items-center justify-between border-t border-border/50 mt-auto bg-muted/10">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-muted-foreground">Price</span>
          <span className="text-lg font-bold text-foreground font-mono">{formattedPrice}</span>
        </div>
        <Link href={`/listing/${listing.id}`}>
          <Button variant="default" size="sm" className="font-semibold">
            View
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export function ListingCardSkeleton() {
  return (
    <Card className="flex flex-col h-full border-border">
      <CardHeader className="pb-3 border-b border-border/50 p-4">
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="h-5 w-16 bg-muted rounded animate-pulse" />
          <div className="h-5 w-12 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-5 w-3/4 bg-muted rounded mt-1 animate-pulse" />
        <div className="h-5 w-1/2 bg-muted rounded mt-1 animate-pulse" />
      </CardHeader>
      <CardContent className="p-4 flex-1 flex flex-col gap-3">
        <div className="h-9 w-full bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-2 mt-auto">
          <div className="h-4 w-20 bg-muted rounded animate-pulse" />
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          <div className="h-4 w-24 bg-muted rounded animate-pulse col-span-2" />
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-3 flex items-center justify-between border-t border-border/50 bg-muted/10">
        <div className="flex flex-col gap-1">
          <div className="h-3 w-10 bg-muted rounded animate-pulse" />
          <div className="h-6 w-20 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-9 w-16 bg-muted rounded animate-pulse" />
      </CardFooter>
    </Card>
  );
}
