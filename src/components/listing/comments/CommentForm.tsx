'use client';

import { useState } from "react";
import { useCreateListingComment, type ListingComment } from "@/lib/api";
import { COMMENT_MAX_LENGTH } from "@/lib/comments";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useCommentErrorHandler } from "./use-comment-error-handler";

export function CommentForm({
  listingId,
  parentCommentId,
  initialBody = "",
  placeholder,
  autoFocus = false,
  submitLabel = "Post",
  onPosted,
  onCancel,
  onParentMissing,
}: {
  listingId: string;
  /** The top-level comment's id when replying. */
  parentCommentId?: string;
  initialBody?: string;
  placeholder: string;
  autoFocus?: boolean;
  submitLabel?: string;
  onPosted: (comment: ListingComment) => void;
  onCancel?: () => void;
  /** The thread being replied to was deleted in the meantime. */
  onParentMissing?: () => void;
}) {
  const [body, setBody] = useState(initialBody);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const createComment = useCreateListingComment();
  const handleError = useCommentErrorHandler();

  const trimmed = body.trim();
  const tooLong = trimmed.length > COMMENT_MAX_LENGTH;
  const canSubmit = trimmed.length > 0 && !tooLong && !createComment.isPending;

  const submit = () => {
    if (!canSubmit) return;
    setFieldError(null);
    createComment.mutate(
      { listingId, data: { body: trimmed, ...(parentCommentId ? { parentCommentId } : {}) } },
      {
        onSuccess: (response) => {
          setBody("");
          onPosted(response.data);
        },
        // The typed text is kept on every error so nothing is lost.
        onError: (error) => {
          if (error.status === 400) {
            const fields = error.data?.error.fields as Record<string, unknown> | undefined;
            const message = fields?.body ?? error.data?.error.message;
            setFieldError(typeof message === "string" ? message : "Please check your comment and try again.");
            return;
          }
          handleError(error, { onNotFound: parentCommentId ? onParentMissing : undefined });
        },
      },
    );
  };

  const inputId = `comment-input-${parentCommentId ?? "new"}`;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-2"
    >
      <label htmlFor={inputId} className="sr-only">{placeholder}</label>
      <Textarea
        id={inputId}
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          if (fieldError) setFieldError(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        rows={parentCommentId ? 2 : 3}
        autoFocus={autoFocus}
        aria-invalid={!!fieldError || tooLong}
        aria-describedby={`${inputId}-meta`}
        className="resize-y"
      />
      <div id={`${inputId}-meta`} className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 text-xs">
          {fieldError ? (
            <p className="text-destructive" role="alert">{fieldError}</p>
          ) : (
            <span className={cn("tabular-nums text-muted-foreground", tooLong && "text-destructive")}>
              {trimmed.length}/{COMMENT_MAX_LENGTH}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={createComment.isPending}>
              Cancel
            </Button>
          )}
          <Button type="submit" variant="accent" size="sm" disabled={!canSubmit}>
            {createComment.isPending && <Spinner className="mr-1.5" />}
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
