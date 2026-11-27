import type { Metadata } from "next";
import { getI18n, localizedRedirect } from "@/i18n/server";
import { getUser } from "@/lib/supabase/server";
import { ApiKeysClient } from "@/components/account/ApiKeysClient";

// Gated on a per-request session check — never statically cache this route.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.pageTitles.apiKeys, robots: { index: false, follow: false }, };
}

export default async function ApiKeysPage() {
  const user = await getUser();
  if (!user) {
    await localizedRedirect("/sign-in");
  }

  return <ApiKeysClient />;
}
