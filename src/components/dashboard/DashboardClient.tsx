'use client';

import Link from "next/link";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import {
  getGetListingsQueryOptions,
  getGetListingsQueryKey,
  getGetRequestsQueryKey,
  getGetSavedListingsQueryKey,
  getGetInquiriesQueryKey,
  useUpdateListingStatus,
  useDeleteListing,
  useGetRequests,
  useGetMyProfile,
  useUpdateRequestStatus,
  useGetSavedListings,
  useUnsaveListing,
  useGetInquiries,
  useUpdateInquiryStatus,
  ListingStatus,
  HardwareRequestStatus,
  InquiryStatus,
  type Listing,
  type HardwareRequest,
  type Inquiry,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  HardDrive, Inbox, Bookmark,
  Plus, ExternalLink, Trash2, Send, X, MessageSquare, CheckCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// The backend only exposes "my listings" as a filter on the public search
// endpoint (`GET /listings?status=DRAFT`, etc.). Non-public statuses are
// scoped to the caller server-side, but PUBLISHED returns everyone's
// listings — so results are filtered to the signed-in seller below, by the
// backend user id from `GET /me` (it differs from the Supabase auth id).
const MY_LISTING_STATUSES = [
  ListingStatus.PUBLISHED,
  ListingStatus.DRAFT,
  ListingStatus.PENDING_REVIEW,
  ListingStatus.REJECTED,
  ListingStatus.EXPIRED,
] as const;

function useMyListings(userId: string | undefined) {
  const results = useQueries({
    queries: MY_LISTING_STATUSES.map((status) =>
      getGetListingsQueryOptions({ status, limit: 100 }),
    ),
  });

  const isLoading = results.some((r) => r.isLoading);
  const listings = results
    .flatMap((r) => r.data?.data ?? [])
    .filter((l) => l.sellerId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return { listings, isLoading };
}

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

function getStatusBadge(status: string) {
  switch (status) {
    case ListingStatus.PUBLISHED:
    case HardwareRequestStatus.OPEN:
      return <Badge variant="success" className="uppercase text-[10px]">Active</Badge>;
    case ListingStatus.PENDING_REVIEW:
    case HardwareRequestStatus.MATCHED:
      return <Badge variant="warning" className="uppercase text-[10px] bg-yellow-500 text-white">Pending</Badge>;
    case ListingStatus.DRAFT:
    case HardwareRequestStatus.CANCELLED:
    case ListingStatus.EXPIRED:
      return <Badge variant="secondary" className="uppercase text-[10px]">Inactive</Badge>;
    case ListingStatus.SOLD:
    case HardwareRequestStatus.CLOSED:
      return <Badge variant="default" className="uppercase text-[10px]">Completed</Badge>;
    case ListingStatus.REJECTED:
      return <Badge variant="destructive" className="uppercase text-[10px]">Rejected</Badge>;
    default:
      return <Badge variant="outline" className="uppercase text-[10px]">{status}</Badge>;
  }
}

function getInquiryStatusBadge(status: string) {
  switch (status) {
    case InquiryStatus.OPEN:
      return <Badge variant="warning" className="uppercase text-[10px] bg-yellow-500 text-white">Open</Badge>;
    case InquiryStatus.RESPONDED:
      return <Badge variant="success" className="uppercase text-[10px]">Responded</Badge>;
    case InquiryStatus.CLOSED:
      return <Badge variant="secondary" className="uppercase text-[10px]">Closed</Badge>;
    default:
      return <Badge variant="outline" className="uppercase text-[10px]">{status}</Badge>;
  }
}

export function DashboardClient() {
  // Ownership fields (sellerId, buyerId) hold the backend user id, not the
  // Supabase auth id — compare against the backend profile.
  const { data: profile, isLoading: profileLoading } = useGetMyProfile();
  const myId = profile?.data.id;
  const { listings: myListings, isLoading: myListingsLoading } = useMyListings(myId);
  const listingsLoading = profileLoading || myListingsLoading;
  const { data: myRequestsData, isLoading: requestsLoading } = useGetRequests();
  const { data: savedData, isLoading: savedLoading } = useGetSavedListings();
  const { data: inquiriesData, isLoading: inquiriesLoading } = useGetInquiries();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateStatus = useUpdateListingStatus();
  const deleteListing = useDeleteListing();
  const updateRequestStatus = useUpdateRequestStatus();
  const unsaveListing = useUnsaveListing();
  const updateInquiryStatus = useUpdateInquiryStatus();

  const myRequests = myRequestsData?.data ?? [];
  const savedListings = savedData?.data ?? [];
  const inquiries = inquiriesData?.data ?? [];
  const receivedInquiries = inquiries.filter((i) => i.sellerId === myId);
  const sentInquiries = inquiries.filter((i) => i.buyerId === myId);

  const refreshMyListings = () => {
    queryClient.invalidateQueries({ queryKey: getGetListingsQueryKey() });
  };

  const handleSubmitForReview = (listing: Listing) => {
    updateStatus.mutate(
      { id: listing.id, data: { status: ListingStatus.PENDING_REVIEW } },
      {
        onSuccess: () => {
          refreshMyListings();
          toast({ title: "Submitted for review", description: "An admin will review your listing shortly." });
        },
        onError: () => {
          toast({ title: "Error", description: "Couldn't submit this listing for review.", variant: "destructive" });
        },
      },
    );
  };

  const handleDeleteListing = (listing: Listing) => {
    deleteListing.mutate(
      { id: listing.id },
      {
        onSuccess: () => {
          refreshMyListings();
          toast({ title: "Listing deleted" });
        },
        onError: () => {
          toast({ title: "Error", description: "Couldn't delete this listing.", variant: "destructive" });
        },
      },
    );
  };

  const handleCancelRequest = (request: HardwareRequest) => {
    updateRequestStatus.mutate(
      { id: request.id, data: { status: HardwareRequestStatus.CANCELLED } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetRequestsQueryKey() });
          toast({ title: "Request cancelled" });
        },
        onError: () => {
          toast({ title: "Error", description: "Couldn't cancel this request.", variant: "destructive" });
        },
      },
    );
  };

  const handleUnsave = (listingId: string) => {
    unsaveListing.mutate(
      { listingId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSavedListingsQueryKey() });
          toast({ title: "Removed from saved listings" });
        },
      },
    );
  };

  const handleInquiryStatus = (inquiry: Inquiry, status: (typeof InquiryStatus)[keyof typeof InquiryStatus]) => {
    updateInquiryStatus.mutate(
      { id: inquiry.id, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetInquiriesQueryKey() });
        },
        onError: () => {
          toast({ title: "Error", description: "Couldn't update this inquiry.", variant: "destructive" });
        },
      },
    );
  };

  const activeListingsCount = myListings.filter((l) => l.status === ListingStatus.PENDING_REVIEW).length;
  const draftListingsCount = myListings.filter((l) => l.status === ListingStatus.DRAFT).length;
  const openRequestsCount = myRequests.filter((r) => r.status === HardwareRequestStatus.OPEN).length;
  const openInquiriesCount = receivedInquiries.filter((i) => i.status === InquiryStatus.OPEN).length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-foreground font-heading">Dashboard</h1>
        <div className="flex gap-3 w-full sm:w-auto">
          <Link href="/sell" className="flex-1 sm:flex-none">
            <Button variant="outline" className="w-full">
              <Plus className="mr-2 h-4 w-4" /> List Hardware
            </Button>
          </Link>
          <Link href="/request" className="flex-1 sm:flex-none">
            <Button className="w-full bg-accent hover:bg-accent/90 text-white">
              <Plus className="mr-2 h-4 w-4" /> New Request
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Drafts</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {listingsLoading ? "..." : draftListingsCount}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-yellow-600 dark:text-yellow-500">
              {listingsLoading ? "..." : activeListingsCount}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Requests</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {requestsLoading ? "..." : openRequestsCount}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saved</CardTitle>
            <Bookmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {savedLoading ? "..." : savedListings.length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Inquiries</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {inquiriesLoading ? "..." : openInquiriesCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="listings" className="w-full">
        <TabsList className="mb-6 w-full sm:w-auto h-auto p-1 bg-muted/50 border border-border flex-wrap">
          <TabsTrigger value="listings" className="py-2.5 px-6 font-semibold">My Listings</TabsTrigger>
          <TabsTrigger value="requests" className="py-2.5 px-6 font-semibold">My Requests</TabsTrigger>
          <TabsTrigger value="saved" className="py-2.5 px-6 font-semibold">Saved</TabsTrigger>
          <TabsTrigger value="inquiries" className="py-2.5 px-6 font-semibold">Inquiries</TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="m-0">
          <Card className="border-border shadow-sm">
            {listingsLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading your listings...</div>
            ) : myListings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Hardware</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myListings.map((listing) => (
                    <TableRow key={listing.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="truncate max-w-[200px] sm:max-w-[300px]">{listing.title}</span>
                          <span className="text-xs text-muted-foreground font-mono">{listing.manufacturer} {listing.model}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        ${Number(listing.price).toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(listing.status)}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {formatDate(listing.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {listing.status === ListingStatus.DRAFT && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              title="Submit for review"
                              disabled={updateStatus.isPending}
                              onClick={() => handleSubmitForReview(listing)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          <Link href={`/listing/${listing.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            title="Delete listing"
                            disabled={deleteListing.isPending}
                            onClick={() => handleDeleteListing(listing)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <HardDrive className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-bold mb-2">No listings yet</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  You haven't listed any hardware for sale. Create your first listing to reach our marketplace of buyers.
                </p>
                <Link href="/sell">
                  <Button>Create Listing</Button>
                </Link>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="m-0">
          <Card className="border-border shadow-sm">
            {requestsLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading your requests...</div>
            ) : myRequests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Requirement</TableHead>
                    <TableHead>Budget/Unit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Destination</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="truncate max-w-[200px] sm:max-w-[300px]">{req.title}</span>
                          <span className="text-xs text-muted-foreground font-mono">Qty: {req.quantity} • {req.minVramGb ? `${req.minVramGb}GB+` : 'Any VRAM'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {req.maxBudgetPerUnit ? `$${req.maxBudgetPerUnit.toLocaleString()}` : 'Open'}
                      </TableCell>
                      <TableCell>{getStatusBadge(req.status)}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {req.destinationCity || req.destinationCountry
                          ? [req.destinationCity, req.destinationCountry].filter(Boolean).join(", ")
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {(req.status === HardwareRequestStatus.OPEN || req.status === HardwareRequestStatus.MATCHED) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            title="Cancel request"
                            disabled={updateRequestStatus.isPending}
                            onClick={() => handleCancelRequest(req)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <Inbox className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-bold mb-2">No active requests</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  Can't find what you need? Post a request and sellers will contact you with matching hardware.
                </p>
                <Link href="/request">
                  <Button className="bg-accent text-white hover:bg-accent/90 border-0">Post Request</Button>
                </Link>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="saved" className="m-0">
          <Card className="border-border shadow-sm">
            {savedLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading saved listings...</div>
            ) : savedListings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Hardware</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="hidden md:table-cell">Saved</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {savedListings.map((saved) => (
                    <TableRow key={saved.id}>
                      <TableCell className="font-medium">
                        {saved.listing ? (
                          <div className="flex flex-col">
                            <span className="truncate max-w-[200px] sm:max-w-[300px]">{saved.listing.title}</span>
                            <span className="text-xs text-muted-foreground font-mono">{saved.listing.manufacturer} {saved.listing.model}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">Listing no longer available</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {saved.listing ? `$${Number(saved.listing.price).toLocaleString()}` : '—'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {formatDate(saved.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {saved.listing && (
                            <Link href={`/listing/${saved.listingId}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            title="Remove from saved"
                            disabled={unsaveListing.isPending}
                            onClick={() => handleUnsave(saved.listingId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <Bookmark className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-bold mb-2">No saved listings</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  Save listings from the marketplace to find them here later.
                </p>
                <Link href="/gpus">
                  <Button>Browse Hardware</Button>
                </Link>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="inquiries" className="m-0 space-y-6">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Received</h3>
            <Card className="border-border shadow-sm">
              {inquiriesLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading inquiries...</div>
              ) : receivedInquiries.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Listing</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receivedInquiries.map((inquiry) => (
                      <TableRow key={inquiry.id}>
                        <TableCell className="font-medium">
                          {inquiry.listing ? (
                            <Link href={`/listing/${inquiry.listingId}`} className="hover:text-accent truncate max-w-[160px] block">
                              {inquiry.listing.title}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground italic">Listing</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[280px] truncate">{inquiry.message}</TableCell>
                        <TableCell>{getInquiryStatusBadge(inquiry.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {inquiry.status === InquiryStatus.OPEN && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                title="Mark responded"
                                disabled={updateInquiryStatus.isPending}
                                onClick={() => handleInquiryStatus(inquiry, InquiryStatus.RESPONDED)}
                              >
                                <CheckCheck className="h-4 w-4" />
                              </Button>
                            )}
                            {inquiry.status !== InquiryStatus.CLOSED && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                title="Close inquiry"
                                disabled={updateInquiryStatus.isPending}
                                onClick={() => handleInquiryStatus(inquiry, InquiryStatus.CLOSED)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-8 text-center text-muted-foreground">No inquiries on your listings yet.</div>
              )}
            </Card>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Sent</h3>
            <Card className="border-border shadow-sm">
              {inquiriesLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading inquiries...</div>
              ) : sentInquiries.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Listing</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sentInquiries.map((inquiry) => (
                      <TableRow key={inquiry.id}>
                        <TableCell className="font-medium">
                          {inquiry.listing ? (
                            <Link href={`/listing/${inquiry.listingId}`} className="hover:text-accent truncate max-w-[160px] block">
                              {inquiry.listing.title}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground italic">Listing</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[280px] truncate">{inquiry.message}</TableCell>
                        <TableCell>{getInquiryStatusBadge(inquiry.status)}</TableCell>
                        <TableCell className="text-right">
                          {inquiry.status !== InquiryStatus.CLOSED && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              title="Close inquiry"
                              disabled={updateInquiryStatus.isPending}
                              onClick={() => handleInquiryStatus(inquiry, InquiryStatus.CLOSED)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-8 text-center text-muted-foreground">You haven't contacted any sellers yet.</div>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
