"use client";

import { Copy, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { useResetStagePortalCredential } from "@/api/client/server-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/lib/toast";

/**
 * Shows a stage's one-time judge-portal PIN. The PIN is hashed at rest, so
 * it can only be displayed at provision/reset time. After creating a stage
 * the caller passes the freshly-minted PIN via `initialPin` so the manager
 * can copy it without triggering a reset (which would invalidate any
 * session already logged in with that PIN). Later opens show nothing until
 * the manager explicitly clicks "Reset PIN".
 * Shared by the Stages management screen and the Judgement dashboard.
 */
export function StagePortalCredentialDialog({
  festivalId,
  stageId,
  stageName,
  open,
  onOpenChange,
  isReadOnly = false,
  initialPin = null,
}: {
  festivalId: string;
  stageId: string | null;
  stageName?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isReadOnly?: boolean;
  /** PIN returned by stage creation; shown once when the dialog opens. */
  initialPin?: string | null;
}) {
  const [revealedPin, setRevealedPin] = useState<string | null>(null);
  const reset = useResetStagePortalCredential();

  // Seed the revealed PIN from the caller whenever it changes (e.g. when the
  // credentials dialog is auto-opened after a stage was created). Closing the
  // dialog clears it so a re-open without a fresh `initialPin` starts clean.
  useEffect(() => {
    if (initialPin) {
      setRevealedPin(initialPin);
    }
  }, [initialPin]);

  const copyToClipboard = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied.`);
    } catch {
      toast.error("Couldn't copy. Select the value manually.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setRevealedPin(null);
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            Stage portal{stageName ? ` for ${stageName}` : ""}
          </DialogTitle>
          <DialogDescription>
            Judges enter this PIN on the stage portal to log in. Share it
            securely — it's only shown right after creation or reset.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {revealedPin ? (
            <div className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                PIN (shown once — copy it now)
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <p className="min-w-0 flex-1 truncate font-mono text-lg font-bold tracking-widest text-primary">
                  {revealedPin}
                </p>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 shrink-0"
                  aria-label="Copy PIN"
                  onClick={() => void copyToClipboard("PIN", revealedPin)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              The PIN is only shown right after it's created or reset.
            </p>
          )}
          {!isReadOnly && stageId ? (
            <Button
              variant="outline"
              className="w-full"
              disabled={reset.isPending}
              onClick={() => {
                reset.mutate(
                  { festivalId, stageId },
                  {
                    onSuccess: (data) => {
                      setRevealedPin(data.pin);
                      toast.success("Stage portal PIN reset.");
                    },
                  },
                );
              }}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              {reset.isPending ? "Resetting…" : "Reset PIN"}
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
