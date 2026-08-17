import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { RequestFormClient } from "@/components/request/RequestFormClient";

// Gated on a per-request session check — never statically cache this route.
export const dynamic = "force-dynamic";

export default async function RequestPage() {
  const user = await getUser();
  if (!user) {
    redirect("/sign-in");
  }

  return <RequestFormClient />;
}
