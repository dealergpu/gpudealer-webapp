'use client';

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import { MessageSquare, Trash2 } from "lucide-react";
import {
  ApiError,
  getListingCommentReplies,
  getListingComments,
  ListingStatus,
  useDeleteListingComment,
  useGetMyProfile,
  type ListingComment,
  type ListingCommentsResponse,
  type ListingCommentThread,
  type Pagination,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { signInPath } from "@/lib/auth-redirect";
import {
  COMMENTS_PAGE_SIZE,
  REPLIES_PAGE_SIZE,
  appendUnique,
  fullTimestamp,
  relativeTime,
} from "@/lib/comments";
import { profilePath } from "@/lib/profile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { CommentForm } from "./CommentForm";
import { useCommentErrorHandler } from "./use-comment-error-handler";

type Thread = ListingCommentThread & {
  /** Last page of the replies endpoint merged in; page 1 is the embedded replies. */
  repliesPage: number;
  repliesDone: boolean;
  loadingReplies: boolean;
};

const hasMoreReplies = (thread: Thread) => !thread.repliesDone && thread.replyCount > thread.replies.length;

function toThread(comment: ListingCommentThread): Thread {
  return {
    ...comment,
    repliesPage: 1,
    repliesDone: comment.replyCount <= comment.replies.length,
    loadingReplies: false,
  };
}

export function ListingComments({
  listingId,
  listingPath,
  listingStatus,
  sellerId,
  initial,
}: {
  listingId: string;
  listingPath: string;
  listingStatus: ListingStatus;
  sellerId?: string;
  /** First page, fetched on the server. Null if that fetch failed. */
  initial: ListingCommentsResponse | null;
}) {
  const { t } = useI18n();
  const c = t.comments;
  const { user, isLoading: authLoading } = useAuth();
  // Author ids are backend user ids — compare against /me, never the Supabase id.
  const { data: me } = useGetMyProfile({ query: { enabled: !!user } });
  const { toast } = useToast();
  const handleError = useCommentErrorHandler();
  const deleteComment = useDeleteListingComment();

  const [threads, setThreads] = useState<Thread[]>(() => initial?.data.map(toThread) ?? []);
  const [pagination, setPagination] = useState<Pagination | null>(initial?.pagination ?? null);
  const [loadingPage, setLoadingPage] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ threadId: string; mention?: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ListingComment | null>(null);

  const canPost = listingStatus === ListingStatus.PUBLISHED;
  const canInteract = canPost && !!user;
  // Unpublished listings are fully read-only: no replies, no deletes.
  const myId = canInteract ? me?.data.id : undefined;

  const updateThread = (id: string, update: (thread: Thread) => Thread) =>
    setThreads((prev) => prev.map((t) => (t.id === id ? update(t) : t)));
  const removeThread = (id: string) => setThreads((prev) => prev.filter((t) => t.id !== id));

  const loadPage = async (page: number) => {
    setLoadingPage(true);
    try {
      const response = await getListingComments(listingId, { page, limit: COMMENTS_PAGE_SIZE });
      const incoming = response.data.map(toThread);
      setThreads((prev) => (page === 1 ? incoming : appendUnique(prev, incoming)));
      setPagination(response.pagination);
    } catch {
      if (page > 1) toast({ title: c.loadMoreFailed, description: c.pleaseTryAgain, variant: "destructive" });
    } finally {
      setLoadingPage(false);
    }
  };

  const loadMoreReplies = async (thread: Thread) => {
    const page = thread.repliesPage + 1;
    updateThread(thread.id, (t) => ({ ...t, loadingReplies: true }));
    try {
      const response = await getListingCommentReplies(listingId, thread.id, { page, limit: REPLIES_PAGE_SIZE });
      updateThread(thread.id, (t) => ({
        ...t,
        replies: appendUnique(t.replies, response.data),
        replyCount: response.pagination.total,
        repliesPage: page,
        repliesDone: page >= response.pagination.totalPages,
        loadingReplies: false,
      }));
    } catch (error) {
      updateThread(thread.id, (t) => ({ ...t, loadingReplies: false }));
      if (error instanceof ApiError && error.status === 404) {
        removeThread(thread.id);
        toast({ title: c.commentGone, description: c.commentGoneBody, variant: "destructive" });
      } else {
        toast({ title: c.loadRepliesFailed, description: c.pleaseTryAgain, variant: "destructive" });
      }
    }
  };

  const removeComment = (comment: ListingComment) => {
    if (comment.parentCommentId) {
      updateThread(comment.parentCommentId, (t) => ({
        ...t,
        replies: t.replies.filter((r) => r.id !== comment.id),
        replyCount: Math.max(0, t.replyCount - 1),
      }));
    } else {
      // Deleting a top-level comment deletes its replies too.
      removeThread(comment.id);
      setPagination((p) => (p ? { ...p, total: Math.max(0, p.total - 1) } : p));
    }
  };

  const confirmDelete = () => {
    const comment = pendingDelete;
    if (!comment) return;
    deleteComment.mutate(
      { listingId, commentId: comment.id },
      {
        onSuccess: () => {
          removeComment(comment);
          setPendingDelete(null);
          toast({ title: c.deleted });
        },
        onError: (error) => {
          setPendingDelete(null);
          handleError(error, { onNotFound: () => removeComment(comment) });
        },
      },
    );
  };

  const onPostedTopLevel = (comment: ListingComment) => {
    setThreads((prev) => [
      toThread({ ...comment, replyCount: 0, replies: [] }),
      ...prev.filter((t) => t.id !== comment.id),
    ]);
    setPagination((p) => (p ? { ...p, total: p.total + 1 } : p));
  };

  const onPostedReply = (threadId: string, reply: ListingComment) => {
    updateThread(threadId, (t) => ({
      ...t,
      replies: appendUnique(t.replies, [reply]),
      replyCount: t.replyCount + 1,
    }));
    setReplyingTo(null);
  };

  const hasMore = !!pagination && pagination.page < pagination.totalPages;

  return (
    <section id="comments" aria-labelledby="comments-heading" className="scroll-mt-28 rounded-2xl border border-border bg-card p-6 sm:p-8">
      <h2 id="comments-heading" className="mb-6 flex items-center gap-2 font-display text-3xl">
        {c.title}
        {!!pagination?.total && (
          <span className="font-sans text-sm font-normal tabular-nums text-muted-foreground">({pagination.total})</span>
        )}
      </h2>

      {/* Comment box, or why there isn't one */}
      <div className="mb-8">
        {!canPost ? (
          <p className="rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
            {listingStatus === ListingStatus.SOLD
              ? c.soldReadOnly
              : c.readOnly}
          </p>
        ) : authLoading ? (
          <div className="h-24 animate-pulse rounded-xl bg-muted" />
        ) : user ? (
          <CommentForm
            listingId={listingId}
            placeholder={c.placeholder}
            onPosted={onPostedTopLevel}
          />
        ) : (
          <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-dashed border-border px-4 py-4 sm:flex-row sm:items-center">
            <p className="text-sm text-muted-foreground">{c.haveQuestion}</p>
            <Button asChild variant="outline" size="sm">
              <Link href={signInPath(`${listingPath}#comments`)}>{c.logInToComment}</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Comments */}
      {pagination === null ? (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">{c.loadFailed}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => loadPage(1)} disabled={loadingPage}>
            {loadingPage && <Spinner className="mr-1.5" />}
            {t.common.tryAgain}
          </Button>
        </div>
      ) : threads.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <MessageSquare className="mb-3 h-6 w-6 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">
            {canPost ? c.emptyCanPost : c.empty}
          </p>
        </div>
      ) : (
        <ol className="space-y-6">
          {threads.map((thread) => (
            <li key={thread.id}>
              <CommentItem
                comment={thread}
                sellerId={sellerId}
                myId={myId}
                canReply={canInteract}
                onReply={() => setReplyingTo({ threadId: thread.id })}
                onDelete={() => setPendingDelete(thread)}
              />

              {(thread.replies.length > 0 || hasMoreReplies(thread) || replyingTo?.threadId === thread.id) && (
                <div className="ml-4 mt-4 space-y-4 border-l border-border pl-4 sm:ml-11">
                  {thread.replies.length > 0 && (
                    <ol className="space-y-4">
                      {thread.replies.map((reply) => (
                        <li key={reply.id}>
                          <CommentItem
                            comment={reply}
                            sellerId={sellerId}
                            myId={myId}
                            canReply={canInteract}
                            small
                            onReply={() => setReplyingTo({ threadId: thread.id, mention: reply.author.username })}
                            onDelete={() => setPendingDelete(reply)}
                          />
                        </li>
                      ))}
                    </ol>
                  )}

                  {hasMoreReplies(thread) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => loadMoreReplies(thread)}
                      disabled={thread.loadingReplies}
                    >
                      {thread.loadingReplies && <Spinner className="mr-1.5" />}
                      {fmt(c.seeMoreReplies, { count: thread.replyCount - thread.replies.length })}
                    </Button>
                  )}

                  {replyingTo?.threadId === thread.id && canInteract && (
                    <CommentForm
                      // Remount when switching between replying to different people.
                      key={replyingTo.mention ?? thread.id}
                      listingId={listingId}
                      parentCommentId={thread.id}
                      initialBody={replyingTo.mention ? `@${replyingTo.mention} ` : ""}
                      placeholder={fmt(c.replyTo, { username: thread.author.username })}
                      submitLabel={c.reply}
                      autoFocus
                      onPosted={(reply) => onPostedReply(thread.id, reply)}
                      onCancel={() => setReplyingTo(null)}
                      onParentMissing={() => {
                        setReplyingTo(null);
                        removeThread(thread.id);
                      }}
                    />
                  )}
                </div>
              )}

            </li>
          ))}
        </ol>
      )}

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <Button variant="outline" onClick={() => loadPage(pagination.page + 1)} disabled={loadingPage}>
            {loadingPage && <Spinner className="mr-1.5" />}
            {c.seeMore}
          </Button>
        </div>
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && !deleteComment.isPending && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{c.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete && !pendingDelete.parentCommentId
                ? c.deleteThread
                : c.deleteOne}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteComment.isPending}>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                // Keep the dialog open until the request finishes.
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleteComment.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteComment.isPending && <Spinner className="mr-1.5" />}
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function CommentItem({
  comment,
  sellerId,
  myId,
  canReply,
  small = false,
  onReply,
  onDelete,
}: {
  comment: ListingComment;
  sellerId?: string;
  myId?: string;
  canReply: boolean;
  small?: boolean;
  onReply: () => void;
  onDelete: () => void;
}) {
  const { t, intl } = useI18n();
  const { author } = comment;
  const isMine = !!myId && author.id === myId;

  return (
    <article className="flex gap-3">
      <Link href={profilePath(author.username)} tabIndex={-1} aria-hidden className="shrink-0">
        <span
          className={`flex items-center justify-center overflow-hidden rounded-full bg-muted font-semibold text-muted-foreground ${small ? "h-7 w-7 text-xs" : "h-8 w-8 text-sm"}`}
        >
          {author.profilePic ? (
            <img src={author.profilePic} alt="" className="h-full w-full object-cover" />
          ) : (
            author.username.charAt(0).toUpperCase()
          )}
        </span>
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <Link href={profilePath(author.username)} className="font-semibold text-foreground hover:underline">
            {author.username}
          </Link>
          {sellerId && author.id === sellerId && (
            <Badge variant="outline" className="px-1.5 py-0 text-[10px] uppercase tracking-wider">{t.comments.seller}</Badge>
          )}
          <time
            dateTime={comment.createdAt}
            title={fullTimestamp(comment.createdAt, intl)}
            className="text-xs text-muted-foreground"
            // Relative time depends on "now", which differs between server and browser.
            suppressHydrationWarning
          >
            {relativeTime(comment.createdAt, t.comments, intl)}
          </time>
        </div>

        {/* Plain text only: React escapes it, pre-wrap keeps line breaks. */}
        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">{comment.body}</p>

        {(canReply || isMine) && (
          <div className="-ml-2 mt-1 flex gap-1">
            {canReply && (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" onClick={onReply}>
                {t.comments.reply}
              </Button>
            )}
            {isMine && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="mr-1 h-3 w-3" /> {t.common.delete}
              </Button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
