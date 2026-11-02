'use client';

import { usePathname, useRouter } from "next/navigation";
import type { ApiError, ApiErrorResponse } from "@/lib/api";
import { signInPath } from "@/lib/auth-redirect";
import { useToast } from "@/hooks/use-toast";

/**
 * Shared handling for comment API errors (everything except 400, which the
 * comment box shows inline).
 */
export function useCommentErrorHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  return (error: ApiError<ApiErrorResponse>, { onNotFound }: { onNotFound?: () => void } = {}) => {
    const message = error.data?.error?.message;
    switch (error.status) {
      case 401:
        toast({ title: "Please log in again", description: "Your session has expired." });
        router.push(signInPath(`${pathname}#comments`));
        return;
      case 403:
        toast({ title: "Not allowed", description: message ?? "You can't do that.", variant: "destructive" });
        return;
      case 404:
        onNotFound?.();
        toast({
          title: onNotFound ? "That comment no longer exists" : "Not found",
          description: onNotFound ? "It may have been deleted." : message ?? "This listing is no longer available.",
          variant: "destructive",
        });
        return;
      case 429:
        toast({ title: "Slow down", description: "You're commenting too fast, try again in a minute.", variant: "destructive" });
        return;
      default:
        toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
    }
  };
}
