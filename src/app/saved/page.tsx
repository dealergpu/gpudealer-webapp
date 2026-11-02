import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { signInPath } from "@/lib/auth-redirect";
import { SavedListingsClient } from "@/components/saved/SavedListingsClient";

// Gated on a per-request session check — never statically cache this route.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Saved listings",
  robots: { index: false, follow: false },
};

export default async function SavedListingsPage() {
  const user = await getUser();
  if (!user) {
    redirect(signInPath("/saved"));
  }

  return <SavedListingsClient />;
}
