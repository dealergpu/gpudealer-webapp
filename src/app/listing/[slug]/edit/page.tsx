import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { EditListingForm } from "@/components/listing/EditListingForm";

// Gated on a per-request session check — never statically cache this route.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit listing",
  robots: { index: false },
};

export default async function EditListingPage({
  params,
}: {
  // Shares the `[slug]` segment with the detail page, but edit links pass the
  // listing id (stable even when the slug changes). The API accepts either.
  params: Promise<{ slug: string }>;
}) {
  const { slug: id } = await params;
  const user = await getUser();
  if (!user) {
    redirect("/sign-in");
  }

  return <EditListingForm listingId={id} />;
}
