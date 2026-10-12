'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Bookmark, BookmarkCheck, MessageSquare } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateInquiry,
  useGetSavedListings,
  useGetMyProfile,
  useSaveListing,
  useUnsaveListing,
  getGetSavedListingsQueryKey,
  type Listing,
} from "@/lib/api";

export function ListingActions({ listing }: { listing: Listing }) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [message, setMessage] = useState("");

  // sellerId is the backend user id, not the Supabase auth id.
  const { data: profile } = useGetMyProfile({ query: { enabled: !!user } });
  const isOwner = !!profile && profile.data.id === listing.sellerId;

  const savedListings = useGetSavedListings(undefined, { query: { enabled: !!user } });
  const isSaved = savedListings.data?.data.some((s) => s.listingId === listing.id) ?? false;
  const saveListing = useSaveListing();
  const unsaveListing = useUnsaveListing();
  const createInquiry = useCreateInquiry();

  const refreshSaved = () => {
    queryClient.invalidateQueries({ queryKey: getGetSavedListingsQueryKey() });
  };

  const handleToggleSave = () => {
    if (!user) {
      router.push("/sign-in");
      return;
    }
    if (isSaved) {
      unsaveListing.mutate(
        { listingId: listing.id },
        {
          onSuccess: () => {
            refreshSaved();
            toast({ title: "Removed from saved listings" });
          },
        },
      );
    } else {
      saveListing.mutate(
        { listingId: listing.id },
        {
          onSuccess: () => {
            refreshSaved();
            toast({ title: "Saved", description: "Find it later from your dashboard." });
          },
          onError: () => {
            toast({ title: "Error", description: "Couldn't save this listing.", variant: "destructive" });
          },
        },
      );
    }
  };

  const handleContactClick = () => {
    if (!user) {
      router.push("/sign-in");
      return;
    }
    setDialogOpen(true);
  };

  const handleSendInquiry = () => {
    if (!message.trim()) return;
    createInquiry.mutate(
      { listingId: listing.id, data: { message: message.trim() } },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setMessage("");
          toast({ title: "Message sent", description: "The seller will be notified of your inquiry." });
        },
        onError: () => {
          toast({ title: "Error", description: "Couldn't send your message. Please try again.", variant: "destructive" });
        },
      },
    );
  };

  if (isOwner) {
    return (
      <Button variant="outline" className="w-full h-12 text-base font-semibold" disabled>
        This is your listing
      </Button>
    );
  }

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button
            className="w-full h-12 text-base font-bold bg-accent hover:bg-accent/90 text-white"
            onClick={handleContactClick}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Contact Seller
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact seller</DialogTitle>
            <DialogDescription>
              Send a message about &ldquo;{listing.title}&rdquo;. The seller will see your inquiry from their dashboard.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Is this still available? Would you ship to..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[120px]"
          />
          <DialogFooter>
            <Button
              onClick={handleSendInquiry}
              disabled={!message.trim() || createInquiry.isPending}
              className="bg-accent hover:bg-accent/90 text-white"
            >
              {createInquiry.isPending ? "Sending..." : "Send Message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button
        variant="outline"
        className="w-full h-12 text-base font-semibold border-border"
        onClick={handleToggleSave}
        disabled={saveListing.isPending || unsaveListing.isPending}
      >
        {isSaved ? (
          <>
            <BookmarkCheck className="mr-2 h-4 w-4" />
            Saved
          </>
        ) : (
          <>
            <Bookmark className="mr-2 h-4 w-4" />
            Save Listing
          </>
        )}
      </Button>
    </>
  );
}
