import { getI18n, localizedRedirect } from "@/i18n/server";
import type { Metadata } from "next";
import { getUser } from "@/lib/supabase/server";
import { SellForm } from "@/components/sell/SellForm";

// Gated on a per-request session check — never statically cache this route.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.pageTitles.sell, robots: { index: false, follow: true } };
}

export default async function SellPage() {
  const user = await getUser();
  if (!user) {
    await localizedRedirect("/sign-in");
  }

  return <SellForm />;
}
