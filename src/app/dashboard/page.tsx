import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

// Gated on a per-request session check — never statically cache this route.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) {
    redirect("/sign-in");
  }

  return <DashboardClient />;
}
