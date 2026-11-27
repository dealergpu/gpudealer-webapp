import type { Metadata } from "next";
import { getI18n, localizedRedirect } from "@/i18n/server";
import { getUser } from "@/lib/supabase/server";
import { EditListingForm } from "@/components/listing/EditListingForm";

// Gated on a per-request session check — never statically cache this route.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.pageTitles.editListing, robots: { index: false }, };
}

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
    await localizedRedirect("/sign-in");
  }

  return <EditListingForm listingId={id} />;
}
