import { useParams, Link } from "wouter";
import { 
  useGetListing, 
  getGetListingQueryKey 
} from "@workspace/api-client-react";
import { 
  Server, Cpu, Zap, HardDrive, Network, Tag, 
  MapPin, Clock, ExternalLink, ShieldCheck, User,
  ChevronLeft, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

export function ListingDetail() {
  const params = useParams();
  const id = Number(params.id);

  const { data: listing, isLoading, isError } = useGetListing(id, {
    query: {
      enabled: !isNaN(id),
      queryKey: getGetListingQueryKey(id)
    }
  });

  if (isNaN(id)) {
    return <div className="container mx-auto py-20 text-center text-destructive">Invalid listing ID</div>;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl animate-pulse">
        <div className="h-4 w-24 bg-muted rounded mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="h-10 w-3/4 bg-muted rounded"></div>
            <div className="h-6 w-1/4 bg-muted rounded"></div>
            <div className="h-64 w-full bg-muted rounded"></div>
            <div className="h-40 w-full bg-muted rounded"></div>
          </div>
          <div className="space-y-6">
            <div className="h-64 w-full bg-muted rounded"></div>
            <div className="h-40 w-full bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !listing) {
    return (
      <div className="container mx-auto py-20 text-center flex flex-col items-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Listing not found</h2>
        <p className="text-muted-foreground mb-6">This listing may have been removed or sold.</p>
        <Link href="/gpus">
          <Button variant="default">Back to Marketplace</Button>
        </Link>
      </div>
    );
  }

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: listing.currency || "USD",
  }).format(listing.price);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

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
              {listing.condition === "new" && <Badge variant="success" className="uppercase text-xs">New</Badge>}
              {listing.condition === "refurbished" && <Badge variant="warning" className="uppercase text-xs bg-orange-500 text-white">Refurbished</Badge>}
              {listing.condition === "used" && <Badge variant="secondary" className="uppercase text-xs">Used</Badge>}
              
              {listing.verified && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 uppercase text-xs flex items-center gap-1 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                  <ShieldCheck className="h-3 w-3" />
                  Verified
                </Badge>
              )}
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground font-sans mb-4 leading-tight">
              {listing.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {listing.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{listing.location}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Listed {formatDate(listing.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Tag className="h-4 w-4" />
                <span>ID: #{listing.id}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {listing.description && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 font-sans border-b border-border pb-2">Description</h2>
              <div className="prose prose-sm sm:prose-base max-w-none text-foreground whitespace-pre-wrap">
                {listing.description}
              </div>
            </div>
          )}

          {/* Technical Specs */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="bg-muted/30 px-6 py-4 border-b border-border">
              <h2 className="text-xl font-bold font-sans">Technical Specifications</h2>
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
                {listing.vram != null && (
                  <TableRow>
                    <TableCell className="font-medium text-muted-foreground bg-muted/10 flex items-center gap-2">
                      <Zap className="h-4 w-4" /> VRAM
                    </TableCell>
                    <TableCell className="font-mono">{listing.vram} GB</TableCell>
                  </TableRow>
                )}
                {listing.gpuCount != null && (
                  <TableRow>
                    <TableCell className="font-medium text-muted-foreground bg-muted/10 flex items-center gap-2">
                      <Server className="h-4 w-4" /> GPU Count
                    </TableCell>
                    <TableCell>{listing.gpuCount}</TableCell>
                  </TableRow>
                )}
                {listing.cpu && (
                  <TableRow>
                    <TableCell className="font-medium text-muted-foreground bg-muted/10 flex items-center gap-2">
                      <Cpu className="h-4 w-4" /> CPU
                    </TableCell>
                    <TableCell>{listing.cpu}</TableCell>
                  </TableRow>
                )}
                {listing.ram && (
                  <TableRow>
                    <TableCell className="font-medium text-muted-foreground bg-muted/10">RAM</TableCell>
                    <TableCell>{listing.ram}</TableCell>
                  </TableRow>
                )}
                {listing.storage && (
                  <TableRow>
                    <TableCell className="font-medium text-muted-foreground bg-muted/10 flex items-center gap-2">
                      <HardDrive className="h-4 w-4" /> Storage
                    </TableCell>
                    <TableCell>{listing.storage}</TableCell>
                  </TableRow>
                )}
                {listing.networking && (
                  <TableRow>
                    <TableCell className="font-medium text-muted-foreground bg-muted/10 flex items-center gap-2">
                      <Network className="h-4 w-4" /> Networking
                    </TableCell>
                    <TableCell>{listing.networking}</TableCell>
                  </TableRow>
                )}
                {listing.formFactor && (
                  <TableRow>
                    <TableCell className="font-medium text-muted-foreground bg-muted/10">Form Factor</TableCell>
                    <TableCell>{listing.formFactor}</TableCell>
                  </TableRow>
                )}
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
              {listing.quantity && listing.quantity > 1 && (
                <p className="text-sm mt-2 font-medium bg-white/10 inline-block px-3 py-1 rounded-full">
                  Qty Available: {listing.quantity}
                </p>
              )}
            </div>
            
            <CardContent className="p-6 space-y-4">
              {listing.source === "external" && listing.externalUrl ? (
                <Button className="w-full h-12 text-base font-bold" asChild>
                  <a href={listing.externalUrl} target="_blank" rel="noopener noreferrer">
                    View Original Listing
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              ) : (
                <Button className="w-full h-12 text-base font-bold bg-accent hover:bg-accent/90 text-white">
                  Contact Seller
                </Button>
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
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Seller</p>
                <p className="font-semibold text-sm truncate">{listing.sellerName || "Anonymous User"}</p>
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
