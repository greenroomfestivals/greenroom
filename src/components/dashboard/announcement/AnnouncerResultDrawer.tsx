"use client";

import { Loader2, Megaphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { InternalResultPosterSection } from "@/components/festival/posters/InternalResultPosterSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/core/utils/cn";
import { announceResult } from "@/features/announcement/actions/announcer.actions";
import type { AnnouncerQueueProgramme } from "@/features/announcement/services/announcer.service";
import { toast } from "@/lib/toast";

const MEDAL_ROWS = [
  "bg-amber-500/10",
  "bg-slate-400/10",
  "bg-orange-500/10",
] as const;

interface AnnouncerResultDrawerProps {
  festivalId: string;
  festivalSlug: string;
  activeProgramme: AnnouncerQueueProgramme | null;
  onOpenChange: (open: boolean) => void;
  onAnnounceSuccess?: () => void;
}

export function AnnouncerResultDrawer({
  festivalId,
  festivalSlug,
  activeProgramme,
  onOpenChange,
  onAnnounceSuccess,
}: AnnouncerResultDrawerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleAnnounce() {
    if (!activeProgramme) return;
    startTransition(async () => {
      const res = await announceResult(festivalId, activeProgramme.id);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success(
        `Result #${activeProgramme.resultNumber} announced — "${activeProgramme.name}" is now live.`,
      );
      onOpenChange(false);
      onAnnounceSuccess?.();
      router.refresh();
    });
  }

  return (
    <Drawer open={!!activeProgramme} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {activeProgramme && (
            <>
              <DrawerHeader>
                <DrawerTitle className="flex items-center gap-2">
                  {activeProgramme.resultNumber != null && (
                    <span className="inline-flex items-center justify-center rounded-lg bg-violet-500/10 px-2 py-0.5 font-mono text-sm font-bold text-violet-600 dark:text-violet-400">
                      #{activeProgramme.resultNumber}
                    </span>
                  )}
                  <span className="text-xl">{activeProgramme.name}</span>
                </DrawerTitle>
                <div className="flex items-center gap-2">
                  <DrawerDescription>
                    {activeProgramme.categoryName}
                  </DrawerDescription>
                  <Badge variant="outline" className="text-[10px]">
                    {activeProgramme.type === "GROUP" ? "Group" : "Individual"}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {activeProgramme.stageType === "NON_STAGE"
                      ? "Offstage"
                      : "Stage"}
                  </Badge>
                </div>
              </DrawerHeader>

              {/* Result roster */}
              <div className="space-y-2 py-4 px-4 sm:px-6">
                <p className="text-sm font-medium">Result Roster</p>
                <div className="border rounded-xl shadow-sm overflow-hidden bg-card">
                  <div className="hidden sm:block overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead className="w-12">SI</TableHead>
                          <TableHead className="w-16">Code</TableHead>
                          <TableHead className="w-20">Prize</TableHead>
                          <TableHead>Participant</TableHead>
                          <TableHead>Group</TableHead>
                          <TableHead className="w-16">Grade</TableHead>
                          <TableHead className="w-20 text-right">
                            Award Pts
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeProgramme.results
                          .sort(
                            (a, b) => (a.position ?? 999) - (b.position ?? 999),
                          )
                          .map((r, idx) => (
                            <TableRow
                              key={r.id}
                              className={cn(
                                r.position != null &&
                                  MEDAL_ROWS[r.position - 1],
                              )}
                            >
                              <TableCell className="text-muted-foreground font-mono">
                                {idx + 1}
                              </TableCell>
                              <TableCell className="font-mono">
                                {r.codeLetter ?? "—"}
                              </TableCell>
                              <TableCell>
                                {r.position === 1
                                  ? "🥇 1st"
                                  : r.position === 2
                                    ? "🥈 2nd"
                                    : r.position === 3
                                      ? "🥉 3rd"
                                      : "—"}
                              </TableCell>
                              <TableCell className="font-medium">
                                {r.participantName ?? "—"}
                                {r.chestNumber && (
                                  <span className="text-xs text-muted-foreground ml-1">
                                    ({r.chestNumber})
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {r.groupName ?? "—"}
                              </TableCell>
                              <TableCell className="font-medium">
                                {r.grade ?? "—"}
                              </TableCell>
                              <TableCell className="text-right font-mono font-bold">
                                {r.awardPoints}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Mobile Cards View */}
                  <div className="block sm:hidden divide-y divide-border">
                    {activeProgramme.results
                      .sort((a, b) => (a.position ?? 999) - (b.position ?? 999))
                      .map((r, idx) => (
                        <div
                          key={r.id}
                          className={cn(
                            "p-4 flex flex-col gap-3",
                            r.position != null && MEDAL_ROWS[r.position - 1],
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2">
                              <span className="text-muted-foreground font-mono text-xs mt-0.5 w-4 shrink-0">
                                {idx + 1}.
                              </span>
                              <span className="font-semibold text-sm">
                                {r.participantName ?? "—"}
                                {r.chestNumber && (
                                  <span className="text-xs text-muted-foreground ml-1 font-normal">
                                    ({r.chestNumber})
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {r.position != null && r.position <= 3 ? (
                                <span className="font-bold text-sm flex items-center gap-1">
                                  {r.position === 1
                                    ? "🥇"
                                    : r.position === 2
                                      ? "🥈"
                                      : "🥉"}
                                  <span
                                    className={
                                      r.position === 1
                                        ? "text-amber-600 dark:text-amber-400"
                                        : r.position === 2
                                          ? "text-slate-500 dark:text-slate-300"
                                          : "text-orange-600 dark:text-orange-400"
                                    }
                                  >
                                    {r.position === 1
                                      ? "1st"
                                      : r.position === 2
                                        ? "2nd"
                                        : "3rd"}
                                  </span>
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pl-6 text-xs text-muted-foreground">
                            {r.codeLetter && (
                              <div className="flex items-center gap-1">
                                <span className="opacity-70">Code:</span>
                                <span className="font-mono text-foreground font-medium">
                                  {r.codeLetter}
                                </span>
                              </div>
                            )}
                            {r.groupName && (
                              <div className="flex items-center gap-1">
                                <span className="opacity-70">Group:</span>
                                <span className="font-medium text-foreground">
                                  {r.groupName}
                                </span>
                              </div>
                            )}
                            {r.grade && (
                              <div className="flex items-center gap-1">
                                <span className="opacity-70">Grade:</span>
                                <span className="font-medium text-foreground">
                                  {r.grade}
                                </span>
                              </div>
                            )}
                            {r.awardPoints != null && r.awardPoints > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="opacity-70">Points:</span>
                                <span className="font-mono font-bold text-foreground">
                                  {r.awardPoints}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <DrawerFooter className="flex-col sm:flex-row items-center justify-between gap-2 px-4 pb-8 pt-4">
                <div className="flex-1 flex flex-col gap-1 items-start">
                  <p className="text-xs text-muted-foreground">
                    {activeProgramme.resultNumber != null
                      ? `This publishes result #${activeProgramme.resultNumber} to the public site and generates the poster.`
                      : "Assign a result number first."}
                  </p>
                  <InternalResultPosterSection
                    programmeId={activeProgramme.id}
                    festivalSlug={festivalSlug}
                  />
                </div>
                <Button
                  onClick={handleAnnounce}
                  size="lg"
                  disabled={isPending || activeProgramme.resultNumber == null}
                  className="relative overflow-hidden font-bold bg-violet-600 hover:bg-violet-700 text-white"
                >
                  {isPending ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Megaphone className="h-5 w-5 mr-2" />
                  )}
                  Mark as Announced
                </Button>
              </DrawerFooter>
              {activeProgramme.resultNumber == null && (
                <p className="text-xs text-amber-600 dark:text-amber-400 px-4 pb-6">
                  No result number assigned.
                </p>
              )}
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
