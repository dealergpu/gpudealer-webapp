'use client';

import Link from "next/link";
import {
  useGetDashboardStats,
  useGetMyListings,
  useGetMyRequests
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity, HardDrive, Inbox, Bookmark,
  Plus, Search, ExternalLink
} from "lucide-react";
import { ListingCard } from "@/components/ListingCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function DashboardClient() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: myListings, isLoading: listingsLoading } = useGetMyListings();
  const { data: myRequests, isLoading: requestsLoading } = useGetMyRequests();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
      case 'open':
        return <Badge variant="success" className="uppercase text-[10px]">Active</Badge>;
      case 'pending_review':
      case 'matched':
        return <Badge variant="warning" className="uppercase text-[10px] bg-yellow-500 text-white">Pending</Badge>;
      case 'draft':
      case 'cancelled':
      case 'expired':
        return <Badge variant="secondary" className="uppercase text-[10px]">Inactive</Badge>;
      case 'sold':
      case 'closed':
        return <Badge variant="default" className="uppercase text-[10px]">Completed</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="uppercase text-[10px]">Rejected</Badge>;
      default:
        return <Badge variant="outline" className="uppercase text-[10px]">{status}</Badge>;
    }
  };

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Listings</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {statsLoading ? "..." : stats?.activeListings || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Items</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-yellow-600 dark:text-yellow-500">
              {statsLoading ? "..." : stats?.pendingListings || 0}
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
              {statsLoading ? "..." : stats?.openRequests || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saved Items</CardTitle>
            <Bookmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {statsLoading ? "..." : stats?.savedCount || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="listings" className="w-full">
        <TabsList className="mb-6 w-full sm:w-auto h-auto p-1 bg-muted/50 border border-border">
          <TabsTrigger value="listings" className="py-2.5 px-6 font-semibold">My Listings</TabsTrigger>
          <TabsTrigger value="requests" className="py-2.5 px-6 font-semibold">My Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="m-0">
          <Card className="border-border shadow-sm">
            {listingsLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading your listings...</div>
            ) : myListings && myListings.length > 0 ? (
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
                        ${listing.price.toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(listing.status)}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {formatDate(listing.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/listing/${listing.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
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
            ) : myRequests && myRequests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Requirement</TableHead>
                    <TableHead>Budget/Unit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Timeline</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="truncate max-w-[200px] sm:max-w-[300px]">{req.modelRequirement}</span>
                          <span className="text-xs text-muted-foreground font-mono">Qty: {req.quantity} • {req.vramMin ? `${req.vramMin}GB+` : 'Any VRAM'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {req.budgetPerUnit ? `$${req.budgetPerUnit.toLocaleString()}` : 'Open'}
                      </TableCell>
                      <TableCell>{getStatusBadge(req.status)}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {req.requiredBy ? req.requiredBy.replace('_', ' ') : 'Flexible'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <Search className="h-4 w-4" />
                        </Button>
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
      </Tabs>
    </div>
  );
}
