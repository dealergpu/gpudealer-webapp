'use client';

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, Check, Copy, KeyRound, Plus, RefreshCw, Trash2 } from "lucide-react";
import {
  useGetApiKeys,
  useCreateApiKey,
  useRotateApiKey,
  useRevokeApiKey,
  getGetApiKeysQueryKey,
  type ApiError,
  type ApiErrorResponse,
  type ApiKey,
  type ApiKeyWithSecret,
} from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

// Enforced by the backend (409 CONFLICT); mirrored here only to disable the button.
const MAX_ACTIVE_KEYS = 10;
const NAME_MAX_LENGTH = 100;
const LIST_PARAMS = { page: 1, limit: 24 };

type DialogState =
  | { mode: "create" }
  | { mode: "reveal"; apiKey: ApiKeyWithSecret; rotated: boolean }
  | null;

type ConfirmState = { action: "rotate" | "revoke"; apiKey: ApiKey } | null;

const errorBody = (error: ApiError<ApiErrorResponse>) => error.data?.error;

/** `error.fields` values may be a message or a list of messages. */
function fieldMessage(value: unknown): string {
  if (Array.isArray(value)) return value.map(String).join(" ");
  return typeof value === "string" ? value : "Invalid value";
}

function RelativeDate({ value }: { value: string }) {
  const date = new Date(value);
  return (
    <time dateTime={value} title={date.toLocaleString()}>
      {formatDistanceToNow(date, { addSuffix: true })}
    </time>
  );
}

export function ApiKeysClient() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useGetApiKeys(LIST_PARAMS);
  const rotateKey = useRotateApiKey();
  const revokeKey = useRevokeApiKey();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const keys = data?.data ?? [];
  const activeCount = data?.pagination.total ?? keys.length;
  const atLimit = activeCount >= MAX_ACTIVE_KEYS;

  const refreshKeys = () => queryClient.invalidateQueries({ queryKey: getGetApiKeysQueryKey() });

  const sessionExpired = () => {
    toast({ title: "Session expired", description: "Please sign in again.", variant: "destructive" });
    router.push("/sign-in");
  };

  const listUnauthorized = error?.status === 401;
  useEffect(() => {
    if (listUnauthorized) router.push("/sign-in");
  }, [listUnauthorized, router]);

  // Shared by rotate and revoke: both 404 when the key is gone already.
  const handleActionError = (err: ApiError<ApiErrorResponse>, fallback: string) => {
    if (err.status === 401) return sessionExpired();
    if (err.status === 404) {
      refreshKeys();
      toast({ title: "Key not found", description: "It may already have been revoked. The list has been refreshed." });
      return;
    }
    toast({ title: fallback, description: errorBody(err)?.message ?? "Please try again.", variant: "destructive" });
  };

  const handleConfirm = () => {
    if (!confirm) return;
    const { action, apiKey } = confirm;
    setConfirm(null);

    if (action === "rotate") {
      rotateKey.mutate(
        { id: apiKey.id },
        {
          onSuccess: (response) => {
            refreshKeys();
            setDialog({ mode: "reveal", apiKey: response.data, rotated: true });
          },
          onError: (err) => handleActionError(err, "Couldn't rotate key"),
        },
      );
    } else {
      revokeKey.mutate(
        { id: apiKey.id },
        {
          onSuccess: () => {
            refreshKeys();
            toast({ title: "API key revoked", description: `"${apiKey.name}" no longer works.` });
          },
          onError: (err) => handleActionError(err, "Couldn't revoke key"),
        },
      );
    }
  };

  const createButton = (
    <Button onClick={() => setDialog({ mode: "create" })} disabled={atLimit}>
      <Plus className="mr-2 h-4 w-4" /> Create API key
    </Button>
  );

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title={<>API <em>keys.</em></>}
        description="Use API keys to let your scripts or AI agents create listings on your behalf. Anyone with a key can act as you, so keep it secret."
      />
      <div className="container mx-auto px-4 py-10">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold">Active keys</h2>
            {data && (
              <p className="text-sm text-muted-foreground tabular-nums">
                {activeCount} of {MAX_ACTIVE_KEYS} used
              </p>
            )}
          </div>
          {atLimit ? (
            <Tooltip>
              <TooltipTrigger asChild>
                {/* Disabled buttons swallow pointer events, so the wrapper hosts the tooltip. */}
                <span tabIndex={0} className="inline-flex">{createButton}</span>
              </TooltipTrigger>
              <TooltipContent>
                You can have up to {MAX_ACTIVE_KEYS} active keys. Revoke one to create another.
              </TooltipContent>
            </Tooltip>
          ) : (
            createButton
          )}
        </div>

        <Card className="border-border shadow-sm">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading your API keys...</div>
          ) : error ? (
            <div className="p-8 flex flex-col items-center gap-4 text-center">
              <p className="text-muted-foreground">Couldn&apos;t load your API keys.</p>
              <Button variant="outline" onClick={() => refetch()}>Try again</Button>
            </div>
          ) : keys.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead className="hidden md:table-cell">Created</TableHead>
                  <TableHead className="hidden sm:table-cell">Last used</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((apiKey) => (
                  <TableRow key={apiKey.id}>
                    <TableCell className="font-medium">
                      <span className="block truncate max-w-[140px] sm:max-w-[280px]" title={apiKey.name}>
                        {apiKey.name}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground whitespace-nowrap">
                      {apiKey.keyPrefix}…
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      <RelativeDate value={apiKey.createdAt} />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {apiKey.lastUsedAt ? <RelativeDate value={apiKey.lastUsedAt} /> : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Rotate key"
                          aria-label={`Rotate key ${apiKey.name}`}
                          disabled={rotateKey.isPending || revokeKey.isPending}
                          onClick={() => setConfirm({ action: "rotate", apiKey })}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          title="Revoke key"
                          aria-label={`Revoke key ${apiKey.name}`}
                          disabled={rotateKey.isPending || revokeKey.isPending}
                          onClick={() => setConfirm({ action: "revoke", apiKey })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <KeyRound className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-bold mb-2">No API keys yet</h3>
              <p className="text-muted-foreground max-w-sm mb-6">
                Create a key to let a script or AI agent list hardware for you.
              </p>
              {createButton}
            </div>
          )}
        </Card>
      </div>

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent
          // Closing the reveal state loses the secret for good — require the explicit button.
          onInteractOutside={(e) => dialog?.mode === "reveal" && e.preventDefault()}
          onEscapeKeyDown={(e) => dialog?.mode === "reveal" && e.preventDefault()}
        >
          {dialog?.mode === "create" && (
            <CreateKeyForm
              onCreated={(apiKey) => {
                refreshKeys();
                setDialog({ mode: "reveal", apiKey, rotated: false });
              }}
              onSessionExpired={sessionExpired}
            />
          )}
          {dialog?.mode === "reveal" && (
            <RevealKey apiKey={dialog.apiKey} rotated={dialog.rotated} onDone={() => setDialog(null)} />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.action === "rotate" ? "Rotate" : "Revoke"} &ldquo;{confirm?.apiKey.name}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.action === "rotate"
                ? "The current key stops working immediately and a new key with the same name is created. Update any scripts or agents that use it."
                : "The key stops working immediately. Anything using it will lose access. This can't be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={confirm?.action === "revoke" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
            >
              {confirm?.action === "rotate" ? "Rotate key" : "Revoke key"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CreateKeyForm({
  onCreated,
  onSessionExpired,
}: {
  onCreated: (apiKey: ApiKeyWithSecret) => void;
  onSessionExpired: () => void;
}) {
  const createKey = useCreateApiKey();
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    setFormError(null);
    if (!trimmed) {
      setNameError("Name is required.");
      return;
    }
    setNameError(null);

    createKey.mutate(
      { data: { name: trimmed } },
      {
        onSuccess: (response) => onCreated(response.data),
        onError: (err) => {
          const body = errorBody(err);
          if (err.status === 401) return onSessionExpired();
          if (err.status === 409) {
            setFormError(body?.message ?? `You already have ${MAX_ACTIVE_KEYS} active keys. Revoke one to create another.`);
            return;
          }
          if (body?.fields?.name !== undefined) {
            setNameError(fieldMessage(body.fields.name));
            return;
          }
          setFormError(body?.message ?? "Couldn't create the key. Please try again.");
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
      <DialogHeader>
        <DialogTitle>Create API key</DialogTitle>
        <DialogDescription>Give the key a name so you can tell where it&apos;s used.</DialogDescription>
      </DialogHeader>
      <div className="space-y-2">
        <Label htmlFor="api-key-name" className="font-semibold">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="api-key-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Meta Muse listing agent"
          maxLength={NAME_MAX_LENGTH}
          autoComplete="off"
          autoFocus
          required
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? "api-key-name-error" : undefined}
        />
        {nameError && (
          <p id="api-key-name-error" className="text-sm text-destructive">{nameError}</p>
        )}
      </div>
      {formError && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      )}
      <DialogFooter>
        <Button type="submit" disabled={createKey.isPending}>
          {createKey.isPending ? "Creating..." : "Create key"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function RevealKey({
  apiKey,
  rotated,
  onDone,
}: {
  apiKey: ApiKeyWithSecret;
  rotated: boolean;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey.key);
      setCopied(true);
    } catch {
      toast({ title: "Couldn't copy", description: "Select the key and copy it manually.", variant: "destructive" });
    }
  };

  return (
    <div className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{rotated ? "Key rotated" : "API key created"}</DialogTitle>
        <DialogDescription>
          {rotated
            ? `Here is the new key for "${apiKey.name}". The old key no longer works.`
            : `Your key "${apiKey.name}" is ready.`}
        </DialogDescription>
      </DialogHeader>
      <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p>Copy this key now. You won&apos;t be able to see it again.</p>
      </div>
      <div className="flex gap-2">
        <Input
          readOnly
          value={apiKey.key}
          aria-label="API key"
          className="font-mono text-sm"
          onFocus={(e) => e.currentTarget.select()}
        />
        <Button type="button" variant="outline" onClick={handleCopy} className="shrink-0">
          {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <DialogFooter>
        <Button type="button" onClick={onDone}>Done</Button>
      </DialogFooter>
    </div>
  );
}
