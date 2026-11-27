'use client';

import { useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import { MessageSquare, Pencil } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { SaveListingButton } from "@/components/listing/SaveListingButton";
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
  useGetMyProfile,
  type Listing,
} from "@/lib/api";

export function ListingActions({ listing }: { listing: Listing }) {
  const router = useRouter();
  const { t } = useI18n();
  const d = t.listingDetail;
  const { user } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [message, setMessage] = useState("");

  // sellerId is the backend user id, not the Supabase auth id.
  const { data: profile } = useGetMyProfile({ query: { enabled: !!user } });
  const isOwner = !!profile && profile.data.id === listing.sellerId;

  const createInquiry = useCreateInquiry();

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
          toast({ title: d.messageSentTitle, description: d.messageSentBody });
        },
        onError: () => {
          toast({ title: d.errorTitle, description: d.messageFailed, variant: "destructive" });
        },
      },
    );
  };

  if (isOwner) {
    return (
      <Button asChild variant="outline" className="w-full h-12 text-base font-semibold">
        <Link href={`/listing/${listing.id}/edit`}>
          <Pencil className="mr-2 h-5 w-5" /> {d.editYourListing}
        </Link>
      </Button>
    );
  }

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="accent"
            className="w-full h-12 text-base font-bold"
            onClick={handleContactClick}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            {d.contactSeller}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{d.contactSellerTitle}</DialogTitle>
            <DialogDescription>
              {fmt(d.contactSellerDescription, { title: listing.title })}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={d.messagePlaceholder}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[120px]"
          />
          <DialogFooter>
            <Button
              variant="accent"
              onClick={handleSendInquiry}
              disabled={!message.trim() || createInquiry.isPending}
              
            >
              {createInquiry.isPending ? d.sending : d.sendMessage}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SaveListingButton listingId={listing.id} variant="full" />
    </>
  );
}
