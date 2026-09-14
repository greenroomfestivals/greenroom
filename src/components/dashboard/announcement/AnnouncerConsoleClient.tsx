"use client";

import { format } from "date-fns";
import { Megaphone, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnnouncerCallListDrawer } from "@/components/dashboard/announcement/AnnouncerCallListDrawer";
import { AnnouncerResultDrawer } from "@/components/dashboard/announcement/AnnouncerResultDrawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/core/utils/cn";
import type {
  ActiveReportingProgramme,
  AnnouncerQueueProgramme,
} from "@/features/announcement/services/announcer.service";
import { useLiveChannel } from "@/hooks/use-live-channel";

interface Props {
  festivalId: string;
  festivalSlug: string;
  queue: AnnouncerQueueProgramme[];
  callList: ActiveReportingProgramme[];
  userName?: string;
}

export function AnnouncerConsoleClient({
  festivalId,
  festivalSlug,
  queue,
  callList,
  userName,
}: Props) {
  const router = useRouter();
  const [selectedCallItem, setSelectedCallItem] =
    useState<ActiveReportingProgramme | null>(null);
  const [selectedQueueItem, setSelectedQueueItem] =
    useState<AnnouncerQueueProgramme | null>(null);

  /* UC6 — listen to the announce channel so the console updates when a
     *different* announcer tab (or another role) advances a result. The
     `router.refresh()` re-runs the server loader, which re-pulls the
     queuedStandings and callList. Hook has its own auto-reconnect; the
     silent announce is fine if SSE drops because the next announce
     triggers another refresh anyway. */
  const { data: announceEvent } = useLiveChannel<{
    programmeId: string;
    position: number;
    resultNumber: number;
    startedAt: string;
  }>({
    url: `/api/v1/festivals/${festivalId}/announce/stream`,
  });

  useEffect(() => {
    if (!announceEvent) return;
    router.refresh();
  }, [announceEvent, router]);

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const emoji = hour < 12 ? "☀️" : hour < 17 ? "👋" : "🌙";
  const dateStr = format(now, "EEEE, MMMM d");

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-4rem)]">
      {/* Greeting Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {greeting}, {userName ? userName.split(" ")[0] : "there"}! {emoji}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            It&apos;s {dateStr}. Let&apos;s get ready for event day.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto mt-4 sm:mt-0">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-xl bg-background shadow-sm hover:bg-muted text-muted-foreground hover:text-foreground border-input"
            onClick={() => router.refresh()}
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <a
            href={`/dashboard/${festivalSlug}/event-works/announcement`}
            className="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium h-10 px-4 transition-colors shadow-sm"
          >
            <Megaphone className="h-4 w-4" />
            Go to Announcement Page
          </a>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-5 flex-1 items-start">
        {/* Left Panel — Announcements */}
        <div className="flex flex-col rounded-2xl border bg-card overflow-hidden h-full">
          <div className="px-5 py-4 border-b bg-muted/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-violet-500" />
              <span className="font-semibold text-sm">Announcements</span>
            </div>
            {queue && queue.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {queue.length}
              </Badge>
            )}
          </div>

          {!queue || queue.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-muted-foreground px-6">
              <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <Megaphone className="h-7 w-7 text-muted-foreground/50" />
              </span>
              <p className="font-medium text-sm">No announcements</p>
              <p className="text-xs mt-1 text-muted-foreground/70">
                Programmes will appear here once judgement is complete.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto divide-y divide-border">
              {queue.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setSelectedQueueItem(item)}
                  className="w-full text-left px-5 py-4 hover:bg-muted/30 transition-colors flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-500/10 shadow-inner">
                      <span className="font-mono text-xs font-bold text-violet-600 dark:text-violet-400">
                        {item.resultNumber != null
                          ? `#${item.resultNumber}`
                          : "—"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className="font-medium text-sm leading-tight truncate text-foreground">
                        {item.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {item.categoryName}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70">
                          • {item.type === "GROUP" ? "Group" : "Individual"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center shrink-0 pr-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-5 h-5 text-muted-foreground opacity-50 transition-opacity group-hover:opacity-100"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel — Call List */}
        <div className="flex flex-col rounded-2xl border bg-card overflow-hidden h-full">
          <div className="px-5 py-4 border-b bg-muted/30 flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-sky-500" />
            <span className="font-semibold text-sm">Call List</span>
            {callList.length > 0 && (
              <Badge variant="secondary" className="ml-auto text-xs">
                {callList.length}
              </Badge>
            )}
          </div>

          {callList.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-muted-foreground px-6">
              <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <Megaphone className="h-7 w-7 text-muted-foreground/50" />
              </span>
              <p className="font-medium text-sm">No programmes called yet</p>
              <p className="text-xs mt-1 text-muted-foreground/70">
                The stage manager will notify you when a programme is ready.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto divide-y divide-border">
              {callList.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className="w-full text-left px-5 py-4 hover:bg-muted/30 transition-colors flex items-start gap-3 group"
                  onClick={() => setSelectedCallItem(item)}
                >
                  {/* Status indicator dot */}
                  <span
                    className={cn(
                      "mt-1.5 flex-shrink-0 h-2 w-2 rounded-full",
                      item.startedAt ? "bg-green-500" : "bg-amber-400",
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm leading-tight truncate">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {item.categoryName && (
                        <span className="text-xs text-muted-foreground">
                          {item.categoryName}
                        </span>
                      )}
                      {item.categoryName && item.stageName && (
                        <span className="text-xs text-muted-foreground">•</span>
                      )}
                      {item.stageName && (
                        <span className="text-xs text-muted-foreground">
                          {item.stageName}
                        </span>
                      )}
                    </div>
                    {item.startedAt && (
                      <span className="text-[11px] text-green-600 dark:text-green-400 font-medium mt-1 block">
                        Started {format(new Date(item.startedAt), "h:mm a")}
                      </span>
                    )}
                  </div>
                  <Badge
                    variant={item.startedAt ? "default" : "outline"}
                    className={cn(
                      "flex-shrink-0 text-[10px] px-2 py-0.5",
                      item.startedAt
                        ? "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20"
                        : "text-amber-600 border-amber-400/40",
                    )}
                  >
                    {item.startedAt ? "In Progress" : "Called"}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnnouncerCallListDrawer
        open={!!selectedCallItem}
        onOpenChange={(open) => !open && setSelectedCallItem(null)}
        item={selectedCallItem}
        festivalId={festivalId}
      />

      <AnnouncerResultDrawer
        festivalId={festivalId}
        festivalSlug={festivalSlug}
        activeProgramme={selectedQueueItem}
        onOpenChange={(open) => !open && setSelectedQueueItem(null)}
        onAnnounceSuccess={() => setSelectedQueueItem(null)}
      />
    </div>
  );
}
