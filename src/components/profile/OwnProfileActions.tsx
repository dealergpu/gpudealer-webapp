'use client';

import Link from "next/link";
import { Pencil } from "lucide-react";
import { useGetMyProfile } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

// The profile page itself is public and server-rendered; this only adds an
// "Edit profile" shortcut when the signed-in viewer owns it. Editing is
// enforced by the API, which only ever updates the caller's own account.
export function OwnProfileActions({ username }: { username: string }) {
  const { user } = useAuth();
  const { data: profile } = useGetMyProfile({ query: { enabled: !!user } });

  if (!user || profile?.data.username !== username) return null;

  return (
    <Button asChild variant="outline">
      <Link href="/account/profile">
        <Pencil className="mr-2 h-4 w-4" /> Edit profile
      </Link>
    </Button>
  );
}
