import type { Metadata } from "next";
import { getI18n, localizedRedirect } from "@/i18n/server";
import { getUser } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

// Gated on a per-request session check — never statically cache this route.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.pageTitles.dashboard, robots: { index: false, follow: false }, };
}

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) {
    await localizedRedirect("/sign-in");
  }

  return <DashboardClient />;
}
