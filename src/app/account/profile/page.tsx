import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";

// Gated on a per-request session check — never statically cache this route.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit profile",
  robots: { index: false, follow: false },
};

export default async function EditProfilePage() {
  const user = await getUser();
  if (!user) {
    redirect("/sign-in");
  }

  return <ProfileEditForm />;
}
