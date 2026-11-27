import { getI18n, localizedRedirect } from "@/i18n/server";
import type { Metadata } from "next";
import { getUser } from "@/lib/supabase/server";
import { RequestFormClient } from "@/components/request/RequestFormClient";

// Gated on a per-request session check — never statically cache this route.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.pageTitles.request, robots: { index: false, follow: true } };
}

export default async function RequestPage() {
  const user = await getUser();
  if (!user) {
    await localizedRedirect("/sign-in");
  }

  return <RequestFormClient />;
}
