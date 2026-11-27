'use client';

import { Link } from "@/i18n/navigation";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import type { Messages } from "@/i18n/messages";
import { CnyPrice } from "@/components/CnyPrice";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetListings,
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
  Plus, ExternalLink, Pencil, Trash2, Send, X, MessageSquare, CheckCheck, KeyRound, UserRound
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/PageHeader";
import { listingPath } from "@/lib/listing-path";
import { formatListingPrice } from "@/lib/listing-price";
import { profilePath } from "@/lib/profile";

type DashboardMessages = Messages["dashboard"];

const formatDate = (dateString: string, intl: string) =>
  new Date(dateString).toLocaleDateString(intl, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

function getStatusBadge(status: string, d: DashboardMessages) {
  switch (status) {
    case ListingStatus.PUBLISHED:
    case HardwareRequestStatus.OPEN:
      return <Badge variant="success" className="uppercase text-[10px]">{d.status.active}</Badge>;
    case ListingStatus.PENDING_REVIEW:
    case HardwareRequestStatus.MATCHED:
      return <Badge variant="warning" className="uppercase text-[10px]">{d.status.pending}</Badge>;
    case ListingStatus.DRAFT:
    case HardwareRequestStatus.CANCELLED:
    case ListingStatus.EXPIRED:
      return <Badge variant="secondary" className="uppercase text-[10px]">{d.status.inactive}</Badge>;
    case ListingStatus.SOLD:
    case HardwareRequestStatus.CLOSED:
      return <Badge variant="default" className="uppercase text-[10px]">{d.status.completed}</Badge>;
    case ListingStatus.REJECTED:
      return <Badge variant="destructive" className="uppercase text-[10px]">{d.status.rejected}</Badge>;
    case ListingStatus.DELISTED:
      return <Badge variant="destructive" className="uppercase text-[10px]">{d.status.delisted}</Badge>;
    default:
      return <Badge variant="outline" className="uppercase text-[10px]">{status}</Badge>;
  }
}

function getInquiryStatusBadge(status: string, d: DashboardMessages) {
  switch (status) {
    case InquiryStatus.OPEN:
      return <Badge variant="warning" className="uppercase text-[10px]">{d.inquiryStatus.open}</Badge>;
    case InquiryStatus.RESPONDED:
      return <Badge variant="success" className="uppercase text-[10px]">{d.inquiryStatus.responded}</Badge>;
    case InquiryStatus.CLOSED:
      return <Badge variant="secondary" className="uppercase text-[10px]">{d.inquiryStatus.closed}</Badge>;
    default:
      return <Badge variant="outline" className="uppercase text-[10px]">{status}</Badge>;
  }
}

export function DashboardClient() {
  // Inquiry sellerId/buyerId hold the backend user id, not the Supabase auth
  // id — compare against the backend profile.
  const { t, intl } = useI18n();
  const d = t.dashboard;
  const { data: profile } = useGetMyProfile();
  const myId = profile?.data.id;
  // `mine=true` returns only the caller's own listings, in every status.
  const { data: myListingsData, isLoading: listingsLoading } = useGetListings({ mine: true, limit: 100 });
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

  const myListings = myListingsData?.data ?? [];
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
          toast({ title: d.submittedTitle, description: d.submittedBody });
        },
        onError: () => {
          toast({ title: d.errorTitle, description: d.submitFailed, variant: "destructive" });
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
          toast({ title: d.listingDeleted });
        },
        onError: () => {
          toast({ title: d.errorTitle, description: d.deleteFailed, variant: "destructive" });
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
          toast({ title: d.requestCancelled });
        },
        onError: () => {
          toast({ title: d.errorTitle, description: d.cancelFailed, variant: "destructive" });
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
          toast({ title: d.removedFromSaved });
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
          toast({ title: d.errorTitle, description: d.inquiryFailed, variant: "destructive" });
        },
      },
    );
  };

  const activeListingsCount = myListings.filter((l) => l.status === ListingStatus.PENDING_REVIEW).length;
  const draftListingsCount = myListings.filter((l) => l.status === ListingStatus.DRAFT).length;
  const openRequestsCount = myRequests.filter((r) => r.status === HardwareRequestStatus.OPEN).length;
  const openInquiriesCount = receivedInquiries.filter((i) => i.status === InquiryStatus.OPEN).length;

  return (
    <>
    <PageHeader eyebrow={d.eyebrow} title={<>{d.titleStart} <em>{d.titleEm}</em></>} description={d.description} />
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h2 className="text-lg font-semibold">{d.overview}</h2>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <Link href={profile ? profilePath(profile.data.username) : "/account/profile"} className="flex-1 sm:flex-none">
            <Button variant="ghost" className="w-full">
              <UserRound className="mr-2 h-4 w-4" /> {d.myProfile}
            </Button>
          </Link>
          <Link href="/account/profile" className="flex-1 sm:flex-none">
            <Button variant="ghost" className="w-full">
              <Pencil className="mr-2 h-4 w-4" /> {d.editProfile}
            </Button>
          </Link>
          <Link href="/account/api-keys" className="flex-1 sm:flex-none">
            <Button variant="ghost" className="w-full">
              <KeyRound className="mr-2 h-4 w-4" /> {d.apiKeys}
            </Button>
          </Link>
          <Link href="/sell" className="flex-1 sm:flex-none">
            <Button variant="outline" className="w-full">
              <Plus className="mr-2 h-4 w-4" /> {d.listHardware}
            </Button>
          </Link>
          <Link href="/request" className="flex-1 sm:flex-none">
            <Button variant="accent" className="w-full">
              <Plus className="mr-2 h-4 w-4" /> {d.newRequest}
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{d.drafts}</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-display text-4xl leading-none tabular-nums">
              {listingsLoading ? "..." : draftListingsCount}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{d.pendingReview}</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-display text-4xl leading-none tabular-nums text-amber-600">
              {listingsLoading ? "..." : activeListingsCount}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{d.openRequests}</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-display text-4xl leading-none tabular-nums">
              {requestsLoading ? "..." : openRequestsCount}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{d.saved}</CardTitle>
            <Bookmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-display text-4xl leading-none tabular-nums">
              {savedLoading ? "..." : savedListings.length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{d.openInquiries}</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-display text-4xl leading-none tabular-nums">
              {inquiriesLoading ? "..." : openInquiriesCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="listings" className="w-full">
        <TabsList className="mb-6 w-full sm:w-auto h-auto p-1 bg-muted/50 border border-border flex-wrap">
          <TabsTrigger value="listings" className="py-2.5 px-6 font-semibold">{d.tabListings}</TabsTrigger>
          <TabsTrigger value="requests" className="py-2.5 px-6 font-semibold">{d.tabRequests}</TabsTrigger>
          <TabsTrigger value="saved" className="py-2.5 px-6 font-semibold">{d.tabSaved}</TabsTrigger>
          <TabsTrigger value="inquiries" className="py-2.5 px-6 font-semibold">{d.tabInquiries}</TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="m-0">
          <Card className="border-border shadow-sm">
            {listingsLoading ? (
              <div className="p-8 text-center text-muted-foreground">{d.loadingListings}</div>
            ) : myListings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>{d.hardware}</TableHead>
                    <TableHead>{d.price}</TableHead>
                    <TableHead>{d.statusLabel}</TableHead>
                    <TableHead className="hidden md:table-cell">{d.date}</TableHead>
                    <TableHead className="text-right">{d.actions}</TableHead>
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
                        {formatListingPrice(listing, 0, t.listing.priceOnRequest)}
                        <CnyPrice amount={listing.price} currency={listing.currency} className="font-sans" />
                      </TableCell>
                      <TableCell>{getStatusBadge(listing.status, d)}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {formatDate(listing.createdAt, intl)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {listing.status === ListingStatus.DRAFT && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              title={d.submitForReview}
                              disabled={updateStatus.isPending}
                              onClick={() => handleSubmitForReview(listing)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <Link href={`/listing/${listing.id}/edit`} title={d.editListing} aria-label={d.editListing}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <Link href={listingPath(listing)} title={d.viewListing} aria-label={d.viewListing}>
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            title={d.deleteListing}
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
                <h3 className="text-lg font-bold mb-2">{d.noListings}</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  {d.noListingsBody}
                </p>
                <Link href="/sell">
                  <Button>{d.createListing}</Button>
                </Link>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="m-0">
          <Card className="border-border shadow-sm">
            {requestsLoading ? (
              <div className="p-8 text-center text-muted-foreground">{d.loadingRequests}</div>
            ) : myRequests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>{d.requirement}</TableHead>
                    <TableHead>{d.budgetPerUnit}</TableHead>
                    <TableHead>{d.statusLabel}</TableHead>
                    <TableHead className="hidden md:table-cell">{d.destination}</TableHead>
                    <TableHead className="text-right">{d.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="truncate max-w-[200px] sm:max-w-[300px]">{req.title}</span>
                          <span className="text-xs text-muted-foreground font-mono">{fmt(d.qtyLine, { quantity: req.quantity, vram: req.minVramGb ? fmt(d.vramPlus, { gb: req.minVramGb }) : d.anyVram })}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {req.maxBudgetPerUnit ? `$${req.maxBudgetPerUnit.toLocaleString("en-US")}` : d.openBudget}
                      </TableCell>
                      <TableCell>{getStatusBadge(req.status, d)}</TableCell>
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
                            title={d.cancelRequest}
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
                <h3 className="text-lg font-bold mb-2">{d.noRequests}</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  {d.noRequestsBody}
                </p>
                <Link href="/request">
                  <Button variant="accent">{d.postRequest}</Button>
                </Link>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="saved" className="m-0">
          <div className="mb-3 flex justify-end">
            <Button asChild variant="link" size="sm" className="h-auto p-0">
              <Link href="/saved">{d.viewAllSaved}</Link>
            </Button>
          </div>
          <Card className="border-border shadow-sm">
            {savedLoading ? (
              <div className="p-8 text-center text-muted-foreground">{d.loadingSaved}</div>
            ) : savedListings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>{d.hardware}</TableHead>
                    <TableHead>{d.price}</TableHead>
                    <TableHead className="hidden md:table-cell">{d.savedDate}</TableHead>
                    <TableHead className="text-right">{d.actions}</TableHead>
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
                          <span className="text-muted-foreground italic">{d.listingUnavailable}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {saved.listing ? formatListingPrice(saved.listing, 0, t.listing.priceOnRequest) : '—'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {formatDate(saved.createdAt, intl)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {saved.listing && (
                            <Link href={listingPath(saved.listing)}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            title={d.removeFromSaved}
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
                <h3 className="text-lg font-bold mb-2">{d.noSaved}</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  {d.noSavedBody}
                </p>
                <Link href="/gpus">
                  <Button>{d.browseHardware}</Button>
                </Link>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="inquiries" className="m-0 space-y-6">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">{d.received}</h3>
            <Card className="border-border shadow-sm">
              {inquiriesLoading ? (
                <div className="p-8 text-center text-muted-foreground">{d.loadingInquiries}</div>
              ) : receivedInquiries.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>{d.listing}</TableHead>
                      <TableHead>{d.message}</TableHead>
                      <TableHead>{d.statusLabel}</TableHead>
                      <TableHead className="text-right">{d.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receivedInquiries.map((inquiry) => (
                      <TableRow key={inquiry.id}>
                        <TableCell className="font-medium">
                          {inquiry.listing ? (
                            <Link href={listingPath(inquiry.listing)} className="hover:text-accent truncate max-w-[160px] block">
                              {inquiry.listing.title}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground italic">{d.listing}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[280px] truncate">{inquiry.message}</TableCell>
                        <TableCell>{getInquiryStatusBadge(inquiry.status, d)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {inquiry.status === InquiryStatus.OPEN && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                title={d.markResponded}
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
                                title={d.closeInquiry}
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
                <div className="p-8 text-center text-muted-foreground">{d.noReceived}</div>
              )}
            </Card>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">{d.sent}</h3>
            <Card className="border-border shadow-sm">
              {inquiriesLoading ? (
                <div className="p-8 text-center text-muted-foreground">{d.loadingInquiries}</div>
              ) : sentInquiries.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>{d.listing}</TableHead>
                      <TableHead>{d.message}</TableHead>
                      <TableHead>{d.statusLabel}</TableHead>
                      <TableHead className="text-right">{d.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sentInquiries.map((inquiry) => (
                      <TableRow key={inquiry.id}>
                        <TableCell className="font-medium">
                          {inquiry.listing ? (
                            <Link href={listingPath(inquiry.listing)} className="hover:text-accent truncate max-w-[160px] block">
                              {inquiry.listing.title}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground italic">{d.listing}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[280px] truncate">{inquiry.message}</TableCell>
                        <TableCell>{getInquiryStatusBadge(inquiry.status, d)}</TableCell>
                        <TableCell className="text-right">
                          {inquiry.status !== InquiryStatus.CLOSED && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              title={d.closeInquiry}
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
                <div className="p-8 text-center text-muted-foreground">{d.noSent}</div>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </>
  );
}
