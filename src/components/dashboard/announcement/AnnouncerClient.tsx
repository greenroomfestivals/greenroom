"use client";

import { ChevronRight, Loader2, Megaphone, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type ReactNode,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { StandingsPointsWithOpener } from "@/components/dashboard/standings/StandingsPointsWithOpener";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { AnnouncerResultDrawer } from "@/components/dashboard/announcement/AnnouncerResultDrawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/core/utils/cn";
import {
  announceResult,
  announceStandings,
} from "@/features/announcement/actions/announcer.actions";
import type {
  AnnouncerQueueProgramme,
  PublishedResultProgramme,
  TeamStandingRow,
} from "@/features/announcement/services/announcer.service";
import { useLiveChannel } from "@/hooks/use-live-channel";
import { toast } from "@/lib/toast";

function QueueActionButton({
  children,
  variant = "default",
  onClick,
  disabled,
}: {
  children: ReactNode;
  variant?: "default" | "outline";
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      size="sm"
      variant={variant}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-8 px-3 text-xs font-medium",
        variant === "default" &&
          "bg-violet-600 hover:bg-violet-700 text-white shadow-sm",
      )}
    >
      {children}
    </Button>
  );
}

interface AnnouncerClientProps {
  festivalId: string;
  festivalSlug: string;
  queue: AnnouncerQueueProgramme[];
  nextResultNumber: number;
  publishedResults: PublishedResultProgramme[];
  standingsContext: {
    publishedStandings: TeamStandingRow[];
    queuedTeamStandings: TeamStandingRow[];
    standingsPublishedAtResultNumber: number | null;
    standingsPublishedAt: string | null;
    standingsAnnouncedAt: string | null;
    highestPublishedResultNumber: number | null;
  };
}

const MEDAL_ROWS = [
  "bg-amber-500/10",
  "bg-slate-400/10",
  "bg-orange-500/10",
] as const;

function PlaceLabel({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
        <span className="text-lg">🥇</span> 1st
      </span>
    );
  if (rank === 2)
    return (
      <span className="flex items-center gap-1.5 font-bold text-slate-500 dark:text-slate-300">
        <span className="text-lg">🥈</span> 2nd
      </span>
    );
  if (rank === 3)
    return (
      <span className="flex items-center gap-1.5 font-bold text-orange-600 dark:text-orange-400">
        <span className="text-lg">🥉</span> 3rd
      </span>
    );
  return <span className="pl-6 text-muted-foreground">{rank}th</span>;
}
export function AnnouncerClient({
  festivalId,
  queue,
  publishedResults,
  standingsContext,
}: AnnouncerClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeProgramme, setActiveProgramme] =
    useState<AnnouncerQueueProgramme | null>(null);

  const [queuePageIndex, setQueuePageIndex] = useState(0);
  const [publishedPageIndex, setPublishedPageIndex] = useState(0);
  const pageSize = 15;

  /* UC3 — score-events stream. The Stage Portal scoring client pushes
     `{ programmeId, judgeId, score, at }` here on every score submission;
     multiple judges might be marking the same programme concurrently.
     A fresh event means the *current* programme's marks panel may be
     stale — refresh the whole console so the announcer sees marks come
     in without manual reloads. Hook auto-reconnects on disconnect. The
     `activeProgramme` is whichever programme the announcer is currently
     marking for; null/empty means there's no live programme to watch. */
  const activeProgrammeId = activeProgramme?.id ?? "";
  const { data: scoreEvent, status: liveStatus } = useLiveChannel<{
    programmeId: string;
    judgeId: string;
    score: number | string;
    at: string;
  }>({
    url: `/api/v1/programmes/${activeProgrammeId || "0"}/score-events/stream`,
  });

  useEffect(() => {
    if (!scoreEvent) return;
    router.refresh();
  }, [scoreEvent, router]);

  /* Polling fallback. 15s cadence matches the pre-Issue-48 behaviour;
     suppressed when SSE is open so we don't double-refresh. */
  useEffect(() => {
    if (liveStatus === "open") return;
    const interval = setInterval(() => router.refresh(), 15_000);
    return () => clearInterval(interval);
  }, [router, liveStatus]);

  const sorted = useMemo(() => {
    return [...queue].sort((a, b) => {
      if (a.resultNumber == null && b.resultNumber == null) return 0;
      if (a.resultNumber == null) return 1;
      if (b.resultNumber == null) return -1;
      return a.resultNumber - b.resultNumber;
    });
  }, [queue]);



  const hasQueue = sorted.length > 0;
  const hasPublished = publishedResults && publishedResults.length > 0;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
        {/* Left Column (3/5) */}
        <div className="md:col-span-3 space-y-8 order-2 md:order-1">
          {!hasQueue && !hasPublished ? (
            <Card className="border-dashed shadow-none">
              <CardContent className="py-12 text-center text-muted-foreground">
                <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/15 to-fuchsia-500/15">
                  <Megaphone className="h-7 w-7 text-violet-500/60" />
                </span>
                <p className="font-medium">No programmes ready to announce</p>
                <p className="text-sm mt-1">
                  Programmes will appear here once judgement is complete.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Card-based Queue */}
              {hasQueue && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
                    </span>
                    Ready to Announce
                  </h2>
                  <div className="grid gap-3">
                    {sorted
                      .slice(
                        queuePageIndex * pageSize,
                        (queuePageIndex + 1) * pageSize,
                      )
                      .map((p) => (
                        // biome-ignore lint/a11y/noStaticElementInteractions: programme card with embedded preview; selecting launches the announcer surface
                        <div
                          key={p.id}
                          onClick={() => setActiveProgramme(p)}
                          className="group flex flex-row items-center justify-between gap-4 rounded-xl border bg-gradient-to-b from-card to-muted/20 p-4 shadow-sm transition-all hover:shadow-md hover:border-violet-500/30 overflow-hidden cursor-pointer"
                        >
                          <div className="flex items-center gap-4 min-w-0 pl-1">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-500/10 shadow-inner">
                              <span className="font-mono text-sm font-bold text-violet-600 dark:text-violet-400">
                                {p.resultNumber != null
                                  ? `#${p.resultNumber}`
                                  : "—"}
                              </span>
                            </div>
                            <div className="min-w-0 flex flex-col justify-center">
                              <p className="font-semibold text-foreground truncate text-base">
                                {p.name}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                <span className="text-muted-foreground text-xs font-medium">
                                  {p.categoryName}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70">
                                  {p.type === "GROUP" ? "Group" : "Individual"}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70">
                                  {p.stageType === "NON_STAGE"
                                    ? "Offstage"
                                    : "Stage"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center shrink-0 pr-1">
                            <ChevronRight className="w-5 h-5 text-muted-foreground opacity-50 transition-opacity group-hover:opacity-100" />
                          </div>
                        </div>
                      ))}
                  </div>

                  {sorted.length > pageSize && (
                    <DataTablePagination
                      pageIndex={queuePageIndex}
                      pageCount={Math.ceil(sorted.length / pageSize)}
                      onPageChange={(page) => setQueuePageIndex(page)}
                      className="mt-4"
                    />
                  )}
                </div>
              )}

              {/* Published Results — compact cards */}
              {hasPublished && (
                <div className="mt-8 space-y-4 opacity-80 hover:opacity-100 transition-opacity">
                  <h2 className="text-lg font-semibold tracking-tight text-muted-foreground">
                    Announced Results
                  </h2>
                  <div className="grid gap-2">
                    {publishedResults
                      .slice(
                        publishedPageIndex * pageSize,
                        (publishedPageIndex + 1) * pageSize,
                      )
                      .map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between gap-4 rounded-lg border bg-card/50 p-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="font-mono text-xs font-bold text-muted-foreground w-10 shrink-0">
                              {p.resultNumber != null
                                ? `#${p.resultNumber}`
                                : "—"}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-muted-foreground truncate">
                                {p.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-muted-foreground text-xs opacity-80">
                                  {p.categoryName}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] h-4 px-1.5 font-normal opacity-70"
                                >
                                  {p.type === "GROUP" ? "Group" : "Individual"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <Badge
                              variant="outline"
                              className="text-muted-foreground opacity-80 text-[10px]"
                            >
                              Announced
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>

                  {publishedResults.length > pageSize && (
                    <DataTablePagination
                      pageIndex={publishedPageIndex}
                      pageCount={Math.ceil(publishedResults.length / pageSize)}
                      onPageChange={(page) => setPublishedPageIndex(page)}
                      className="mt-4"
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Column (2/5) */}
        <div className="space-y-6 md:col-span-2 order-1 md:order-2">
          <div className="border ring-1 ring-border rounded-xl bg-card overflow-hidden shadow-sm sticky top-6">
            <div className="p-4 border-b flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold tracking-tight flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  Team Standings
                </h2>
                {standingsContext.queuedTeamStandings.length > 0 &&
                standingsContext.standingsPublishedAtResultNumber != null ? (
                  <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono px-2 py-0.5 text-xs shadow-sm">
                    After #{standingsContext.standingsPublishedAtResultNumber}
                  </Badge>
                ) : standingsContext.highestPublishedResultNumber != null ? (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono bg-background"
                  >
                    After #{standingsContext.highestPublishedResultNumber}
                  </Badge>
                ) : null}
              </div>

              {standingsContext.queuedTeamStandings.length > 0 && (
                <Button
                  className="w-full bg-[#0088cc] hover:bg-[#0088cc]/90 text-white shadow-sm"
                  onClick={() => {
                    startTransition(async () => {
                      const res = await announceStandings(festivalId);
                      if (!res.success) {
                        toast.error(res.error);
                        return;
                      }
                      toast.success("Standings announced successfully!");
                      router.refresh();
                    });
                  }}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Megaphone className="h-4 w-4 mr-2" />
                  )}
                  Announce Standings
                </Button>
              )}
            </div>

            <ScrollArea className="max-h-[400px]">
              {(standingsContext.queuedTeamStandings.length > 0
                ? standingsContext.queuedTeamStandings
                : standingsContext.publishedStandings
              ).length === 0 ? (
                <p className="text-sm text-muted-foreground p-6 text-center">
                  No standings published yet.
                </p>
              ) : (
                <div className="flex-1 overflow-auto">
                  {/* Desktop Table */}
                  <div className="hidden sm:block">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="pl-5 w-20 font-semibold text-foreground text-xs uppercase tracking-wide">
                            Rank
                          </TableHead>
                          <TableHead className="font-semibold text-foreground text-xs uppercase tracking-wide">
                            Team
                          </TableHead>
                          <TableHead className="text-right pr-5 font-semibold text-foreground text-xs uppercase tracking-wide">
                            Pts
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(standingsContext.queuedTeamStandings.length > 0
                          ? standingsContext.queuedTeamStandings
                          : standingsContext.publishedStandings
                        ).map((s) => (
                          <TableRow
                            key={s.name}
                            className={cn(
                              "hover:bg-muted/40 transition-colors",
                              MEDAL_ROWS[s.rank - 1],
                            )}
                          >
                            <TableCell className="pl-5 py-3">
                              <PlaceLabel rank={s.rank} />
                            </TableCell>
                            <TableCell className="font-medium text-sm py-3">
                              {s.name}
                            </TableCell>
                            <TableCell className="text-right pr-5 font-mono font-bold text-sm py-3 whitespace-nowrap">
                              <StandingsPointsWithOpener
                                teamName={s.name}
                                points={s.points}
                                programmePoints={s.programmePoints}
                                generalPoints={s.generalPoints}
                                generalEntries={s.generalEntries}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="sm:hidden divide-y divide-border">
                    {(standingsContext.queuedTeamStandings.length > 0
                      ? standingsContext.queuedTeamStandings
                      : standingsContext.publishedStandings
                    ).map((s) => (
                      <div
                        key={s.name}
                        className={cn(
                          "px-5 py-3 flex items-center justify-between",
                          MEDAL_ROWS[s.rank - 1],
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <PlaceLabel rank={s.rank} />
                          <span className="font-medium text-sm">{s.name}</span>
                        </div>
                        <StandingsPointsWithOpener
                          teamName={s.name}
                          points={s.points}
                          programmePoints={s.programmePoints}
                          generalPoints={s.generalPoints}
                          generalEntries={s.generalEntries}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>

      <AnnouncerResultDrawer
        festivalId={festivalId}
        activeProgramme={activeProgramme}
        onOpenChange={(open) => !open && setActiveProgramme(null)}
      />
    </>
  );
}
