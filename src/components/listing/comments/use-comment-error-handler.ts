'use client';

import { usePathname, useRouter } from "@/i18n/navigation";
import { useI18n } from "@/i18n/client";
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
  const { t } = useI18n();
  const c = t.comments;

  return (error: ApiError<ApiErrorResponse>, { onNotFound }: { onNotFound?: () => void } = {}) => {
    const message = error.data?.error?.message;
    switch (error.status) {
      case 401:
        toast({ title: t.report.sessionExpiredTitle, description: t.report.sessionExpiredBody });
        router.push(signInPath(`${pathname}#comments`));
        return;
      case 403:
        toast({ title: c.notAllowed, description: message ?? c.cantDoThat, variant: "destructive" });
        return;
      case 404:
        onNotFound?.();
        toast({
          title: onNotFound ? c.commentGone : c.notFound,
          description: onNotFound ? c.commentGoneBody : message ?? c.listingGone,
          variant: "destructive",
        });
        return;
      case 429:
        toast({ title: c.slowDown, description: c.tooFast, variant: "destructive" });
        return;
      default:
        toast({ title: t.error.title, description: c.pleaseTryAgain, variant: "destructive" });
    }
  };
}
