'use client';

import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ContactForm } from "@/components/contact/ContactForm";

/** Wraps its child (a button or link-styled button) so clicking it opens the contact form in a dialog. */
export function ContactDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl font-normal">Contact us</DialogTitle>
          <DialogDescription>Partnerships, bulk sourcing, bugs or anything else — we read every message.</DialogDescription>
        </DialogHeader>
        {/* Remount per open so a sent/success state doesn't linger. */}
        {open && <ContactForm onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}
