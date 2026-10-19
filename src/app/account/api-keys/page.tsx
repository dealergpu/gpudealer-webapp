import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { ApiKeysClient } from "@/components/account/ApiKeysClient";

// Gated on a per-request session check — never statically cache this route.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "API keys",
  robots: { index: false, follow: false },
};

export default async function ApiKeysPage() {
  const user = await getUser();
  if (!user) {
    redirect("/sign-in");
  }

  return <ApiKeysClient />;
}
