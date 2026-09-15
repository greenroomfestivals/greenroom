"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDownUp,
  GripVertical,
  Loader2,
  Megaphone,
  Search,
  Sparkles,
  Trophy,
  Undo2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { StandingsPointsWithOpener } from "@/components/dashboard/standings/StandingsPointsWithOpener";
import { InternalResultPosterSection } from "@/components/festival/posters/InternalResultPosterSection";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  fetchStandingsAction,
  publishAllResultsAction,
  publishResult,
  publishStandings,
  swapResultNumbers,
  unpublishResult,
} from "@/features/announcement/actions/announcer.actions";
import type {
  AnnouncerQueueProgramme,
  TeamStandingRow,
} from "@/features/announcement/services/announcer.service";
import { toast } from "@/lib/toast";

interface ResultsConsoleClientProps {
  festivalId: string;
  festivalSlug: string;
  programmes: AnnouncerQueueProgramme[];
  liveStandings: TeamStandingRow[];
  standingsContext: {
    publishedStandings: TeamStandingRow[];
    standingsPublishedAtResultNumber: number | null;
    standingsPublishedAt: string | null;
    highestPublishedResultNumber: number | null;
  };
  canUnpublish: boolean;
  statusCounts?: Record<string, number>;
}

const STATUS_PILLS = [
  {
    label: "Submitted",
    key: "PENDING_PUBLICATION",
    dot: "bg-amber-500",
    active:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20",
  },
] as const;

// PUBLISHED and ANNOUNCED are both "done", but they are different stages —
// published to the public site vs. read out by the announcer — so they get
// distinct tones instead of a shared green.
const DONE_STATUS_STYLES = {
  PUBLISHED: {
    badge:
      "bg-green-500/10 text-green-600 dark:text-green-400 ring-green-500/25",
    dot: "bg-green-500",
  },
  ANNOUNCED: {
    badge: "bg-sky-500/10 text-sky-600 dark:text-sky-400 ring-sky-500/25",
    dot: "bg-sky-500",
  },
} as const;

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

interface SortableProgrammeRowProps {
  p: AnnouncerQueueProgramme;
  setActiveProgramme: (p: AnnouncerQueueProgramme) => void;
}

function SortableProgrammeRow({
  p,
  setActiveProgramme,
}: SortableProgrammeRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: p.id,
    disabled: p.status === "PUBLISHED" || p.status === "ANNOUNCED",
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(
        "transition-colors bg-background hover:bg-muted/50 cursor-pointer",
        p.status === "ANNOUNCED" && "opacity-50",
        isDragging && "opacity-80 shadow-md relative",
      )}
      onClick={() => {
        setActiveProgramme(p);
      }}
    >
      <TableCell
        className={cn(
          "text-center",
          p.status === "PUBLISHED" || p.status === "ANNOUNCED"
            ? "text-muted-foreground/30 cursor-not-allowed"
            : "cursor-move text-muted-foreground",
        )}
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4 inline-block" />
      </TableCell>
      <TableCell>
        <span className="inline-flex items-center justify-center rounded-lg bg-violet-500/10 px-2 py-1 font-mono text-xs font-bold text-violet-600 dark:text-violet-400">
          {p.resultNumber != null ? `#${p.resultNumber}` : "—"}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{p.name}</span>
          <span className="text-muted-foreground text-xs">
            {p.categoryName}
          </span>
        </div>
      </TableCell>
      <TableCell>
        {p.status === "PUBLISHED" || p.status === "ANNOUNCED" ? (
          <Badge
            variant="secondary"
            className={cn(
              "ring-1 border-0 shadow-none font-medium",
              DONE_STATUS_STYLES[p.status].badge,
            )}
          >
            <span
              className={cn(
                "mr-1.5 h-1.5 w-1.5 rounded-full",
                DONE_STATUS_STYLES[p.status].dot,
              )}
            />
            {p.status}
          </Badge>
        ) : (
          <Badge
            variant="secondary"
            className="bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/25 border-0 shadow-none font-medium"
          >
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
            Submitted
          </Badge>
        )}
      </TableCell>
    </TableRow>
  );
}

function MobileProgrammeCard({
  p,
  setActiveProgramme,
}: SortableProgrammeRowProps) {
  return (
    <Card
      className={cn(
        "flex flex-col gap-3 p-4 bg-card transition-colors cursor-pointer hover:border-primary/40 active:bg-muted/30",
        p.status === "ANNOUNCED" && "opacity-50",
      )}
      onClick={() => {
        setActiveProgramme(p);
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center rounded-lg bg-violet-500/10 px-2 py-1 font-mono text-xs font-bold text-violet-600 dark:text-violet-400">
            {p.resultNumber != null ? `#${p.resultNumber}` : "—"}
          </span>
          {p.status === "PUBLISHED" || p.status === "ANNOUNCED" ? (
            <Badge
              variant="secondary"
              className={cn(
                "ring-1 border-0 shadow-none font-medium text-[10px] px-1.5 py-0",
                DONE_STATUS_STYLES[p.status].badge,
              )}
            >
              <span
                className={cn(
                  "mr-1 h-1.5 w-1.5 rounded-full",
                  DONE_STATUS_STYLES[p.status].dot,
                )}
              />
              {p.status}
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/25 border-0 shadow-none font-medium text-[10px] px-1.5 py-0"
            >
              <span className="mr-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
              Submitted
            </Badge>
          )}
        </div>
      </div>
      <div>
        <div className="font-semibold text-sm">{p.name}</div>
        <div className="text-muted-foreground text-xs">{p.categoryName}</div>
      </div>
    </Card>
  );
}

export function ResultsConsoleClient({
  festivalId,
  festivalSlug: _festivalSlug,
  programmes,
  liveStandings,
  standingsContext,
  canUnpublish,
  statusCounts = {},
}: ResultsConsoleClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeProgramme, setActiveProgramme] =
    useState<AnnouncerQueueProgramme | null>(null);

  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "PENDING_PUBLICATION" | "PUBLISHED" | "ANNOUNCED"
  >("ALL");

  // Section 2 filters
  const [standingsScope, setStandingsScope] = useState<"published" | "all">(
    "published",
  );
  const [upToResultNumber, setUpToResultNumber] = useState<string>("");
  const [dynamicStandings, setDynamicStandings] =
    useState<TeamStandingRow[]>(liveStandings);
  const [isFetchingStandings, setIsFetchingStandings] = useState(false);

  const [swapTarget, setSwapTarget] = useState<string | null>(null);
  const [isSwapDialogOpen, setIsSwapDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedTargetProgramme = useMemo(() => {
    if (!swapTarget) return null;
    return programmes.find((p) => p.id === swapTarget) ?? null;
  }, [programmes, swapTarget]);

  const eligibleSwapProgrammes = useMemo(() => {
    if (!activeProgramme) return [];
    return programmes.filter(
      (p) =>
        p.id !== activeProgramme.id &&
        p.status !== "PUBLISHED" &&
        p.status !== "ANNOUNCED",
    );
  }, [programmes, activeProgramme]);

  const [resultsPageIndex, setResultsPageIndex] = useState(0);
  const [standingsPageIndex, setStandingsPageIndex] = useState(0);
  const pageSize = 15;

  const basePublishedResultsCount = useMemo(
    () =>
      programmes.filter(
        (p) =>
          (p.status === "PUBLISHED" || p.status === "ANNOUNCED") &&
          p.resultNumber != null,
      ).length,
    [programmes],
  );

  // Optimistic delta bumped by +1 on publish and -1 on unpublish so the
  // "After #" input updates immediately, without waiting for the next
  // router.refresh / poll cycle to round-trip.
  const [pendingDelta, setPendingDelta] = useState(0);
  const publishedResultsCount = Math.max(
    0,
    basePublishedResultsCount + pendingDelta,
  );

  // When the server's programmes data reflects our optimistic increment,
  // trim the pending delta so it doesn't double-count.
  const lastBaseCountRef = useRef<number>(basePublishedResultsCount);
  useEffect(() => {
    const changed = basePublishedResultsCount - lastBaseCountRef.current;
    lastBaseCountRef.current = basePublishedResultsCount;
    if (changed !== 0) {
      setPendingDelta((d) => {
        if (Math.sign(d) === Math.sign(changed)) {
          return Math.abs(d) > Math.abs(changed) ? d - changed : 0;
        }
        return d;
      });
    }
  }, [basePublishedResultsCount]);

  const lastAutoWrittenRef = useRef<string | null>(null);

  // Keep the "After #" input synced with the live count of published results.
  // We ensure it never remains empty; if it's cleared, we reset to the default.
  useEffect(() => {
    const next = String(publishedResultsCount);
    setUpToResultNumber((current) => {
      const isStillAutoSynced =
        current === "" || current === lastAutoWrittenRef.current;
      if (!isStillAutoSynced && current !== "") return current;
      lastAutoWrittenRef.current = next;
      return next;
    });
  }, [publishedResultsCount]);

  function bumpOptimisticCount(delta: number) {
    setPendingDelta((d) => d + delta);
  }

  // Reject any typed "0". If empty, let it be temporarily empty until blur or next effect,
  // but practically the effect resets it if empty. Let's just handle changes.
  function handleAfterNumberChange(value: string) {
    lastAutoWrittenRef.current = null;

    // If the user clears the input (backspace to empty), set it to "0".
    if (value === "") {
      setUpToResultNumber("0");
      return;
    }

    setUpToResultNumber(value);
  }

  useEffect(() => {
    setResultsPageIndex(0);
  }, []);

  useEffect(() => {
    setStandingsPageIndex(0);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 15_000);
    return () => clearInterval(interval);
  }, [router]);

  // Handle dynamic standings fetch
  const fetchStandings = useCallback(async () => {
    setIsFetchingStandings(true);
    const resultNum =
      upToResultNumber !== "" && !Number.isNaN(Number(upToResultNumber))
        ? parseInt(upToResultNumber, 10)
        : undefined;
    const res = await fetchStandingsAction(
      festivalId,
      standingsScope,
      resultNum,
    );
    if (res.success && res.data) {
      setDynamicStandings(res.data);
    } else if (!res.success) {
      toast.error(res.error);
    }
    setIsFetchingStandings(false);
  }, [festivalId, standingsScope, upToResultNumber]);

  useEffect(() => {
    fetchStandings();
  }, [fetchStandings]);

  const sorted = useMemo(
    () =>
      [...programmes].sort((a, b) => {
        if (a.resultNumber == null && b.resultNumber == null) return 0;
        if (a.resultNumber == null) return 1;
        if (b.resultNumber == null) return -1;
        return a.resultNumber - b.resultNumber;
      }),
    [programmes],
  );

  const filteredSorted = useMemo(() => {
    let list = sorted;
    if (statusFilter !== "ALL") {
      list = list.filter((p) => p.status === statusFilter);
    }
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          (p.categoryName ?? "").toLowerCase().includes(lower),
      );
    }
    return list;
  }, [sorted, searchQuery, statusFilter]);

  const newResultsSinceStandings =
    standingsContext.highestPublishedResultNumber != null &&
    standingsContext.standingsPublishedAtResultNumber != null
      ? programmes.filter(
          (p) =>
            p.status === "PUBLISHED" &&
            p.resultNumber != null &&
            p.resultNumber > standingsContext.standingsPublishedAtResultNumber!,
        ).length
      : null;

  function handleUnpublish(programmeId: string) {
    startTransition(async () => {
      const res = await unpublishResult(festivalId, programmeId);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Result unpublished — moved back to Announcer.");
      setActiveProgramme(null);
      bumpOptimisticCount(-1);
      fetchStandings();
      router.refresh();
    });
  }

  const pendingPublishCount = useMemo(() => {
    return programmes.filter(
      (p) =>
        p.status === "PENDING_PUBLICATION" && p.results && p.results.length > 0,
    ).length;
  }, [programmes]);

  function handlePublish(programmeId: string) {
    startTransition(async () => {
      const res = await publishResult(festivalId, programmeId);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Result published successfully.");
      setActiveProgramme(null);
      bumpOptimisticCount(1);
      fetchStandings();
      router.refresh();
    });
  }

  function handlePublishAll() {
    startTransition(async () => {
      const res = await publishAllResultsAction(festivalId);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success(
        `Successfully published ${res.data?.publishedCount ?? "all"} results!`,
      );
      bumpOptimisticCount(res.data?.publishedCount ?? 1);
      fetchStandings();
      router.refresh();
    });
  }

  function handleSwapNumbers(programmeIdA: string, programmeIdB: string) {
    if (programmeIdA === programmeIdB) return;
    startTransition(async () => {
      const res = await swapResultNumbers(
        festivalId,
        programmeIdA,
        programmeIdB,
      );
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Result numbers swapped.");
      setSwapTarget(null);
      setIsSwapDialogOpen(false);
      setActiveProgramme(null);
      router.refresh();
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      handleSwapNumbers(active.id as string, over.id as string);
    }
  }

  function handlePublishStandings() {
    const parsedNum = upToResultNumber ? parseInt(upToResultNumber, 10) : NaN;
    if (!upToResultNumber || Number.isNaN(parsedNum) || parsedNum < 0) {
      toast.error(
        "Enter a valid result number before sending to the announcer.",
      );
      return;
    }

    startTransition(async () => {
      const res = await publishStandings(festivalId, parsedNum);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Standings staged for the announcer.");
      router.refresh();
    });
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Section 1 — Results Table */}
        <div className="lg:col-span-3 space-y-4 flex flex-col order-2 lg:order-1">
          {/* Inline Search and Status */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="relative flex-1 w-full md:max-w-[250px]">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search programmes..."
                className="pl-9 h-8 bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
              {/* All Tab */}
              <div
                onClick={() => setStatusFilter("ALL")}
                onKeyDown={(e) => e.key === "Enter" && setStatusFilter("ALL")}
                tabIndex={0}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ring-1 whitespace-nowrap cursor-pointer transition-opacity",
                  "bg-muted/50 text-foreground ring-border hover:bg-muted",
                  statusFilter === "ALL"
                    ? "opacity-100 ring-primary/30"
                    : "opacity-50",
                )}
              >
                <span>All</span>
                <span className="rounded-full bg-foreground/10 px-1.5 text-xs font-bold">
                  {programmes.length}
                </span>
              </div>

              {STATUS_PILLS.map((pill) => (
                <div
                  key={pill.label}
                  onClick={() => setStatusFilter(pill.key)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && setStatusFilter(pill.key)
                  }
                  tabIndex={0}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ring-1 whitespace-nowrap cursor-pointer transition-opacity hover:opacity-100",
                    pill.active,
                    statusFilter === pill.key ? "opacity-100" : "opacity-50",
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full", pill.dot)} />
                  <span>{pill.label}</span>
                  <span className="text-xs font-bold opacity-70">
                    {statusCounts[pill.key] ?? 0}
                  </span>
                </div>
              ))}
              <div
                onClick={() => setStatusFilter("PUBLISHED")}
                onKeyDown={(e) =>
                  e.key === "Enter" && setStatusFilter("PUBLISHED")
                }
                tabIndex={0}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ring-1 whitespace-nowrap bg-green-500/10 text-green-600 dark:text-green-400 ring-green-500/25 cursor-pointer transition-opacity hover:opacity-100",
                  statusFilter === "PUBLISHED" ? "opacity-100" : "opacity-50",
                )}
              >
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span>Published</span>
                <span className="rounded-full bg-green-500/20 px-1.5 text-xs font-bold">
                  {/* biome-ignore lint/complexity/useLiteralKeys: statusCounts is a Record<string, number> */}
                  {statusCounts["PUBLISHED"] ?? 0}
                </span>
              </div>
              <div
                onClick={() => setStatusFilter("ANNOUNCED")}
                onKeyDown={(e) =>
                  e.key === "Enter" && setStatusFilter("ANNOUNCED")
                }
                tabIndex={0}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ring-1 whitespace-nowrap bg-sky-500/10 text-sky-600 dark:text-sky-400 ring-sky-500/25 cursor-pointer transition-opacity hover:opacity-100",
                  statusFilter === "ANNOUNCED" ? "opacity-100" : "opacity-50",
                )}
              >
                <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                <span>Announced</span>
                <span className="rounded-full bg-sky-500/20 px-1.5 text-xs font-bold">
                  {/* biome-ignore lint/complexity/useLiteralKeys: statusCounts is a Record<string, number> */}
                  {statusCounts["ANNOUNCED"] ?? 0}
                </span>
              </div>

              {pendingPublishCount > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      className="h-8 px-2.5 text-xs font-medium shrink-0 bg-primary/10 text-primary border-primary/25 hover:bg-primary hover:text-primary-foreground transition-all gap-1.5 rounded-full"
                    >
                      <Megaphone className="h-3 w-3" />
                      <span>Publish All</span>
                      <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold">
                        {pendingPublishCount}
                      </span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Publish All Results?</AlertDialogTitle>
                      <AlertDialogDescription className="space-y-2 text-left">
                        <span>
                          Are you sure you want to publish{" "}
                          <strong className="text-foreground">
                            {pendingPublishCount}
                          </strong>{" "}
                          submitted programme result
                          {pendingPublishCount > 1 ? "s" : ""}?
                        </span>
                        <span className="block text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-500/10 p-2.5 rounded-md border border-amber-500/20 mt-2">
                          Warning: Publishing results makes scores and standings
                          immediately visible to the public and on live
                          leaderboards.
                        </span>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handlePublishAll}
                        disabled={isPending}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {isPending ? "Publishing..." : "Yes, Publish All"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>

          {newResultsSinceStandings != null && newResultsSinceStandings > 0 && (
            <div className="flex justify-end">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/25">
                <Sparkles className="h-3 w-3" />
                {newResultsSinceStandings} new result
                {newResultsSinceStandings > 1 ? "s" : ""}
              </span>
            </div>
          )}

          {filteredSorted.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <Trophy className="h-7 w-7 text-muted-foreground/60" />
                </span>
                <p className="font-medium">No results found</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden sm:block border rounded-xl bg-card flex-1 overflow-hidden">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={filteredSorted.map((p) => p.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead className="w-20 font-semibold text-foreground">
                            Result #
                          </TableHead>
                          <TableHead className="font-semibold text-foreground">
                            Competition
                          </TableHead>
                          <TableHead className="w-28 font-semibold text-foreground">
                            Status
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSorted
                          .slice(
                            resultsPageIndex * pageSize,
                            (resultsPageIndex + 1) * pageSize,
                          )
                          .map((p) => (
                            <SortableProgrammeRow
                              key={p.id}
                              p={p}
                              setActiveProgramme={setActiveProgramme}
                            />
                          ))}
                      </TableBody>
                    </Table>
                  </SortableContext>
                </DndContext>
              </div>

              {/* Mobile View */}
              <div className="flex sm:hidden flex-col gap-3">
                {filteredSorted
                  .slice(
                    resultsPageIndex * pageSize,
                    (resultsPageIndex + 1) * pageSize,
                  )
                  .map((p) => (
                    <MobileProgrammeCard
                      key={p.id}
                      p={p}
                      setActiveProgramme={setActiveProgramme}
                    />
                  ))}
              </div>
            </>
          )}

          {filteredSorted.length > pageSize && (
            <DataTablePagination
              pageIndex={resultsPageIndex}
              pageCount={Math.ceil(filteredSorted.length / pageSize)}
              onPageChange={(page) => setResultsPageIndex(page)}
              className="mt-4"
            />
          )}
        </div>
        {/* Section 2 — Team Standings */}
        <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-6 lg:self-start order-1 lg:order-2">
          <div className="border ring-1 ring-border rounded-xl bg-card overflow-hidden flex flex-col">
            <div className="p-4 border-b flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold tracking-tight flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  Team Standings
                </h2>
                {upToResultNumber && parseInt(upToResultNumber, 10) > 0 && (
                  <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono px-2 py-0.5 text-xs shadow-sm">
                    After #{upToResultNumber}
                  </Badge>
                )}
              </div>
              <Button
                className="w-full bg-red-600 hover:bg-red-700 text-white shadow-sm"
                disabled={
                  isPending ||
                  !upToResultNumber ||
                  parseInt(upToResultNumber, 10) < 0
                }
                onClick={handlePublishStandings}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Megaphone className="h-4 w-4 mr-2" />
                )}
                Send to Announcer
              </Button>
            </div>

            <div className="bg-muted/30 p-3 border-b flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 w-full sm:w-fit">
                <div className="relative w-1/3 md:w-24">
                  <Input
                    type="number"
                    min={0}
                    placeholder="After #"
                    className="h-8 pl-3 text-sm font-medium bg-background"
                    value={upToResultNumber}
                    onChange={(e) => handleAfterNumberChange(e.target.value)}
                  />
                </div>
                <Select
                  value={standingsScope}
                  onValueChange={(v) =>
                    setStandingsScope(v as "published" | "all")
                  }
                >
                  <SelectTrigger className="h-8 bg-background w-2/3 md:w-fit text-sm font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Published Results</SelectItem>
                    <SelectItem value="all">All Results</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <ScrollArea className="max-h-[400px] relative">
              {isFetchingStandings && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-20 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              {dynamicStandings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No standings data yet.
                </p>
              ) : (
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-card border-b shadow-sm">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-20 pl-4 font-bold text-xs tracking-wider text-muted-foreground uppercase">
                        Rank
                      </TableHead>
                      <TableHead className="font-bold text-xs tracking-wider text-muted-foreground uppercase">
                        Team
                      </TableHead>
                      <TableHead className="text-right pr-4 font-bold text-xs tracking-wider text-muted-foreground uppercase whitespace-nowrap">
                        Pts
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dynamicStandings
                      .slice(
                        standingsPageIndex * pageSize,
                        (standingsPageIndex + 1) * pageSize,
                      )
                      .map((s) => (
                        <TableRow
                          key={s.name}
                          className={cn(
                            "hover:bg-muted/50 transition-colors",
                            MEDAL_ROWS[s.rank - 1],
                          )}
                        >
                          <TableCell className="pl-4 font-medium">
                            <PlaceLabel rank={s.rank} />
                          </TableCell>
                          <TableCell className="font-medium text-[15px]">
                            {s.name}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold pr-4 text-[15px] whitespace-nowrap">
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
              )}
            </ScrollArea>
            {dynamicStandings.length > pageSize && (
              <DataTablePagination
                pageIndex={standingsPageIndex}
                pageCount={Math.ceil(dynamicStandings.length / pageSize)}
                onPageChange={(page) => setStandingsPageIndex(page)}
                className="py-2 border-t mt-auto shrink-0 bg-muted/20"
              />
            )}
          </div>
        </div>
      </div>

      {/* Result detail drawer */}
      <Drawer
        open={!!activeProgramme}
        onOpenChange={(open) => {
          if (!open) {
            setActiveProgramme(null);
            setSwapTarget(null);
            setIsSwapDialogOpen(false);
          }
        }}
      >
        <DrawerContent>
          <div className="max-w-4xl mx-auto w-full p-4 overflow-y-auto">
            {activeProgramme && (
              <>
                <DrawerHeader className="px-0 pt-0">
                  <DrawerTitle className="flex items-center gap-2">
                    {activeProgramme.resultNumber != null && (
                      <span className="inline-flex items-center justify-center rounded-lg bg-violet-500/10 px-2 py-0.5 font-mono text-sm font-bold text-violet-600 dark:text-violet-400">
                        #{activeProgramme.resultNumber}
                      </span>
                    )}
                    <span>{activeProgramme.name}</span>
                  </DrawerTitle>
                  <DrawerDescription asChild>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      {activeProgramme.categoryName}
                      <Badge variant="outline" className="text-[10px]">
                        {activeProgramme.type}
                      </Badge>
                    </div>
                  </DrawerDescription>
                </DrawerHeader>

                {/* Result roster */}
                <div className="space-y-3 mt-2">
                  <p className="text-sm font-semibold">Result Roster</p>
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
                              (a, b) =>
                                (a.position ?? 999) - (b.position ?? 999),
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
                        .sort(
                          (a, b) => (a.position ?? 999) - (b.position ?? 999),
                        )
                        .map((r, idx) => {
                          const isGold = r.position === 1;
                          const isSilver = r.position === 2;
                          const isBronze = r.position === 3;
                          const hasPodium = isGold || isSilver || isBronze;

                          return (
                            <div
                              key={r.id}
                              className={cn(
                                "flex items-center gap-3 p-4 bg-background relative overflow-hidden",
                                isGold && "bg-amber-50/40 dark:bg-amber-900/10",
                                isSilver && "bg-slate-50/50 dark:bg-slate-800/20",
                                isBronze && "bg-orange-50/40 dark:bg-orange-900/10"
                              )}
                            >
                              {hasPodium && (
                                <div
                                  className={cn(
                                    "absolute left-0 top-0 bottom-0 w-1",
                                    isGold && "bg-amber-400",
                                    isSilver && "bg-slate-400",
                                    isBronze && "bg-orange-400"
                                  )}
                                />
                              )}
                              
                              {/* Rank */}
                              <div
                                className={cn(
                                  "flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm border shadow-sm",
                                  isGold ? "bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-900/40 dark:border-amber-900/30" :
                                  isSilver ? "bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-800" :
                                  isBronze ? "bg-orange-100 text-orange-600 border-orange-200 dark:bg-orange-900/40 dark:text-orange-400 dark:border-orange-900/30" :
                                  "bg-muted text-muted-foreground border-transparent shadow-none"
                                )}
                              >
                                {isGold ? "🥇" : isSilver ? "🥈" : isBronze ? "🥉" : idx + 1}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0 py-0.5">
                                <h3 className="text-[13px] sm:text-sm font-bold text-foreground truncate">
                                  {r.participantName ?? "—"}
                                </h3>
                                {r.chestNumber && (
                                  <div className="text-[11px] font-medium text-muted-foreground mt-0.5 truncate">
                                    ID: {r.chestNumber}
                                  </div>
                                )}
                                
                                {/* Badges */}
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {r.groupName && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                                      {r.groupName}
                                    </span>
                                  )}
                                  {r.grade && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                      Grade {r.grade}
                                    </span>
                                  )}
                                  {r.codeLetter && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                                      Code {r.codeLetter}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Points */}
                              {r.awardPoints != null && r.awardPoints > 0 && (
                                <div className="flex-shrink-0 text-right ml-1">
                                  <div className={cn(
                                    "text-xl font-black leading-none",
                                    isGold ? "text-amber-600 dark:text-amber-500" :
                                    isSilver ? "text-slate-600 dark:text-slate-400" :
                                    isBronze ? "text-orange-600 dark:text-orange-500" :
                                    "text-muted-foreground"
                                  )}>
                                    {r.awardPoints}
                                  </div>
                                  <div className={cn(
                                    "text-[9px] font-bold uppercase tracking-wider mt-1",
                                    isGold ? "text-amber-500 dark:text-amber-600/70" :
                                    isSilver ? "text-slate-500 dark:text-slate-500" :
                                    isBronze ? "text-orange-500 dark:text-orange-600/70" :
                                    "text-muted-foreground/70"
                                  )}>
                                    Pts
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>

                <DrawerFooter className="mt-4 px-0 pb-0 flex flex-col items-stretch gap-4">
                  <div className="w-full flex items-center justify-between bg-muted/20 border rounded-lg p-3">
                    <InternalResultPosterSection
                      programmeId={activeProgramme.id}
                      festivalSlug={_festivalSlug}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      disabled={
                        isPending ||
                        activeProgramme.status === "PUBLISHED" ||
                        activeProgramme.status === "ANNOUNCED"
                      }
                      onClick={() => {
                        setSwapTarget(null);
                        setIsSwapDialogOpen(true);
                      }}
                      title={
                        activeProgramme.status === "PUBLISHED" ||
                        activeProgramme.status === "ANNOUNCED"
                          ? "Swap disabled for published results"
                          : undefined
                      }
                      className="w-full sm:w-auto font-medium"
                    >
                      <ArrowDownUp className="h-4 w-4 mr-2" />
                      Swap Result #
                    </Button>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {activeProgramme.status !== "PUBLISHED" &&
                        activeProgramme.status !== "ANNOUNCED" && (
                          <Button
                            size="lg"
                            disabled={isPending}
                            onClick={() => handlePublish(activeProgramme.id)}
                            className="w-full sm:w-auto"
                          >
                            {isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                            ) : (
                              <Megaphone className="h-3.5 w-3.5 mr-1" />
                            )}
                            Publish
                          </Button>
                        )}
                      {canUnpublish &&
                        (activeProgramme.status === "PUBLISHED" ||
                          activeProgramme.status === "ANNOUNCED") && (
                          <Button
                            variant="destructive"
                            size="lg"
                            disabled={isPending}
                            onClick={() => handleUnpublish(activeProgramme.id)}
                            className="w-full sm:w-auto"
                          >
                            {isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                            ) : (
                              <Undo2 className="h-3.5 w-3.5 mr-1" />
                            )}
                            Unpublish
                          </Button>
                        )}
                    </div>
                  </div>
                </DrawerFooter>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Swap Result Number Modal Dialog */}
      <Dialog
        open={isSwapDialogOpen}
        onOpenChange={(open) => {
          setIsSwapDialogOpen(open);
          if (!open) setSwapTarget(null);
        }}
      >
        <DialogContent className="z-[70] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownUp className="h-5 w-5 text-primary" />
              Swap Result Number
            </DialogTitle>
            <DialogDescription>
              Exchange the result sequence number between two programmes.
            </DialogDescription>
          </DialogHeader>

          {activeProgramme && (
            <div className="space-y-4 py-2">
              {/* Selected Current Programme */}
              <div className="rounded-lg border bg-muted/40 p-3 space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Current Programme
                </span>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="inline-flex items-center justify-center rounded-md bg-violet-500/10 px-2 py-0.5 font-mono text-xs font-bold text-violet-600 dark:text-violet-400 shrink-0">
                      {activeProgramme.resultNumber != null
                        ? `#${activeProgramme.resultNumber}`
                        : "—"}
                    </span>
                    <span className="font-semibold text-sm truncate">
                      {activeProgramme.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {activeProgramme.categoryName && (
                      <Badge variant="outline" className="text-[10px]">
                        {activeProgramme.categoryName}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-[10px]">
                      {activeProgramme.type}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Swap indicator */}
              <div className="flex items-center justify-center -my-1">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-xs font-medium border text-muted-foreground">
                  <ArrowDownUp className="h-3.5 w-3.5 text-primary" />
                  <span>Swap with</span>
                </div>
              </div>

              {/* Target programme selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Target Programme
                </Label>
                {eligibleSwapProgrammes.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-3 rounded-md border border-dashed bg-muted/20">
                    No other unpublished programmes available to swap with.
                  </p>
                ) : (
                  <Select
                    value={swapTarget ?? ""}
                    onValueChange={(v) => setSwapTarget(v || null)}
                  >
                    <SelectTrigger className="w-full text-sm font-medium bg-background">
                      <SelectValue placeholder="Select a programme to swap with..." />
                    </SelectTrigger>
                    <SelectContent className="z-[80] max-h-60">
                      {eligibleSwapProgrammes.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          #{p.resultNumber} — {p.name}
                          {p.categoryName ? ` (${p.categoryName})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Preview of Swap Change */}
              {selectedTargetProgramme && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs space-y-1.5">
                  <div className="font-semibold text-foreground flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span>Preview of Changes</span>
                  </div>
                  <div className="space-y-1 text-muted-foreground">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-foreground truncate">
                        {activeProgramme.name}:
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-mono line-through text-muted-foreground">
                          #{activeProgramme.resultNumber}
                        </span>
                        <span>→</span>
                        <span className="font-mono font-bold text-primary">
                          #{selectedTargetProgramme.resultNumber}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-foreground truncate">
                        {selectedTargetProgramme.name}:
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-mono line-through text-muted-foreground">
                          #{selectedTargetProgramme.resultNumber}
                        </span>
                        <span>→</span>
                        <span className="font-mono font-bold text-primary">
                          #{activeProgramme.resultNumber}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSwapDialogOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!swapTarget || isPending}
              onClick={() => {
                if (activeProgramme && swapTarget) {
                  handleSwapNumbers(activeProgramme.id, swapTarget);
                }
              }}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <ArrowDownUp className="h-4 w-4 mr-1.5" />
              )}
              Confirm Swap
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
