"use client";

import {
  Clock,
  Crown,
  Flag,
  Gavel,
  MapPin,
  UserRound,
  Users,
  Users2,
} from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import type { ParticipantsViewState } from "./types";
import { judgementStatusLabel } from "./types";

/**
 * Drawer opened from a judgement-started card so the manager can see who's
 * on stage and what's happening around the round — judges, mode, schedule,
 * status, and timeline of when the round was kicked off vs. the planned
 * window. GROUP programmes render "Teamlead & Party N" with the team name
 * underneath; INDIVIDUAL programmes render the participant label directly.
 */
export function ParticipantsDrawer({
  view,
  onClose,
}: {
  view: ParticipantsViewState | null;
  onClose: () => void;
}) {
  return (
    <Drawer
      open={Boolean(view)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DrawerContent className="w-full">
        <DrawerHeader className="text-left">
          <DrawerTitle>{view?.programmeName}</DrawerTitle>
          <DrawerDescription>
            {view
              ? `${view.programmeType === "GROUP" ? "Reported teams on stage" : "Reported participants on stage"}${view.details.stageName ? ` · ${view.details.stageName}` : ""}`
              : null}
          </DrawerDescription>
        </DrawerHeader>

        {view ? <DrawerBody view={view} /> : null}
      </DrawerContent>
    </Drawer>
  );
}

function DrawerBody({ view }: { view: ParticipantsViewState }) {
  const { active, formatDateTime } = view;

  const timeline = useMemo(
    () => buildTimeline(view, formatDateTime),
    [view, formatDateTime],
  );

  const hasJudges = Boolean(active?.judges?.length);
  const participantsCount = view.details.reportedEntries.length;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="space-y-6 px-4 pb-8">
        {/* Round metadata — quick read at the top. */}
        <div className="flex flex-wrap items-center gap-2">
          {active ? (
            <Badge variant="outline" className="text-[10px]">
              {judgementStatusLabel(active.judgementStatus)}
            </Badge>
          ) : null}
          <Badge
            variant="secondary"
            className="gap-1 text-[10px]"
            aria-label={`Programme type: ${view.programmeType === "GROUP" ? "Group" : "Individual"}`}
          >
            {view.programmeType === "GROUP" ? (
              <Users2 className="h-3 w-3" aria-hidden />
            ) : (
              <UserRound className="h-3 w-3" aria-hidden />
            )}
            {view.programmeType === "GROUP"
              ? "Group programme"
              : "Individual programme"}
          </Badge>
          {active ? (
            <Badge variant="outline" className="text-[10px]">
              {active.judgingMode === "SINGLE" ? "Single judge" : "Group panel"}
            </Badge>
          ) : null}
          {active?.scoreLimit != null ? (
            <Badge variant="outline" className="text-[10px]">
              Max {active.scoreLimit} pts
            </Badge>
          ) : null}
          <Badge variant="outline" className="text-[10px]">
            {participantsCount}{" "}
            {view.programmeType === "GROUP" ? "teams" : "participants"} on stage
          </Badge>
        </div>

        {/* Round configuration — judges, stage, schedule. */}
        {active || view.details.stageName ? (
          <section className="space-y-3 rounded-xl border bg-card/40 p-4">
            <header className="flex items-center gap-2">
              <Gavel
                className="h-3.5 w-3.5 text-muted-foreground"
                aria-hidden
              />
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Round configuration
              </h3>
            </header>

            <dl className="grid gap-2.5 text-xs sm:grid-cols-2">
              {view.details.stageName ? (
                <div className="flex items-start gap-2">
                  <MapPin
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Stage
                    </dt>
                    <dd className="truncate font-medium text-foreground">
                      {view.details.stageName}
                    </dd>
                  </div>
                </div>
              ) : null}

              <div className="flex items-start gap-2">
                {view.programmeType === "GROUP" ? (
                  <Users2
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                ) : (
                  <UserRound
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                )}
                <div className="min-w-0">
                  <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Programme type
                  </dt>
                  <dd className="font-medium text-foreground">
                    {view.programmeType === "GROUP"
                      ? "Group — teams are scored as units"
                      : "Individual — each participant is scored separately"}
                  </dd>
                </div>
              </div>

              {active?.judgingMode ? (
                <div className="flex items-start gap-2">
                  <Flag
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Mode
                    </dt>
                    <dd className="font-medium text-foreground">
                      {active.judgingMode === "SINGLE"
                        ? "Single judge — one judge per round"
                        : "Group panel — every judge scores every code letter"}
                    </dd>
                  </div>
                </div>
              ) : null}
            </dl>

            {hasJudges ? (
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  <Users className="h-3 w-3" aria-hidden />
                  Judges
                  <span className="ml-1 inline-flex items-center justify-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-foreground">
                    {active!.judges.length}
                  </span>
                </div>
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {active!.judges.map((j) => (
                    <li
                      key={j.id}
                      className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs"
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-primary/70"
                        aria-hidden
                      />
                      <span className="truncate font-medium text-foreground">
                        {j.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        {/* Timeline — what happened, in order. */}
        {timeline.length > 0 ? (
          <section className="space-y-3 rounded-xl border bg-card/40 p-4">
            <header className="flex items-center gap-2">
              <Clock
                className="h-3.5 w-3.5 text-muted-foreground"
                aria-hidden
              />
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Timeline
              </h3>
            </header>
            <ol className="relative space-y-3 pl-4">
              <span
                aria-hidden
                className="absolute bottom-2 left-1.5 top-2 w-px bg-border"
              />
              {timeline.map((event, idx) => (
                <li key={`${event.title}-${idx}`} className="relative">
                  <span
                    aria-hidden
                    className="absolute -left-[10px] top-1 h-2 w-2 rounded-full bg-primary ring-2 ring-background"
                  />
                  <p className="text-xs font-semibold text-foreground">
                    {event.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {event.detail}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <Separator />

        {/* Participants — the original "who's on stage" list. */}
        <section>
          <div className="mb-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>
              {view.programmeType === "GROUP" ? "Team" : "Participant"}
            </span>
            <span>Code</span>
          </div>
          {view.details.reportedEntries.length === 0 ? (
            <p className="rounded-md border bg-muted/20 px-3 py-6 text-center text-xs text-muted-foreground">
              No one is on stage yet.
            </p>
          ) : (
            <div className="divide-y divide-border overflow-hidden rounded-lg border bg-card">
              {view.details.reportedEntries.map((entry, idx) => (
                <ParticipantRow
                  key={`${entry.label}-${idx}`}
                  entry={entry}
                  programmeCategory={view.programmeCategory}
                  isGroup={view.programmeType === "GROUP"}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

type TimelineEvent = { title: string; detail: string };

function buildTimeline(
  view: ParticipantsViewState,
  formatDateTime: (value: string | Date) => string,
): TimelineEvent[] {
  const events: Array<{ title: string; detail: string; date: Date }> = [];
  const { details, active, judged } = view;

  if (details.submittedAt) {
    events.push({
      title: "Programme arrived",
      detail: formatDateTime(details.submittedAt),
      date: new Date(details.submittedAt),
    });
  }
  if (active?.startedAt) {
    events.push({
      title: "Judging started",
      detail: formatDateTime(active.startedAt),
      date: new Date(active.startedAt),
    });
  }

  // Include judge progress if available
  if (judged) {
    for (const judge of judged.judges) {
      if (judge.firstScoredAt) {
        events.push({
          title: `${judge.name} started scoring`,
          detail: formatDateTime(judge.firstScoredAt),
          date: new Date(judge.firstScoredAt),
        });
      }
      if (judge.submittedAt) {
        events.push({
          title: `${judge.name} judged`,
          detail: formatDateTime(judge.submittedAt),
          date: new Date(judge.submittedAt),
        });
      }
    }
  }

  // Sort events chronologically
  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  if (events.length === 0) {
    // Always show at least one row so the section isn't empty.
    return [
      {
        title: "Awaiting start",
        detail: "Judging hasn't started yet.",
      },
    ];
  }

  return events.map(({ title, detail }) => ({ title, detail }));
}

function ParticipantRow({
  entry,
  programmeCategory,
  isGroup,
}: {
  entry: ParticipantsViewState["details"]["reportedEntries"][number];
  programmeCategory: string | null;
  isGroup: boolean;
}) {
  const teamNo = entry.teamNumber;
  const partySuffix =
    isGroup && teamNo && teamNo > 0 ? `Party ${teamNo}` : "Party";
  const teamLeadName = isGroup ? entry.label : null;
  const primary = isGroup
    ? `${teamLeadName ?? entry.groupName ?? "Party"} & ${partySuffix}`
    : entry.label;

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2.5 text-xs">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 truncate font-medium text-foreground">
          {isGroup && teamLeadName ? (
            <Crown className="h-3 w-3 shrink-0 text-primary" />
          ) : null}
          <span className="truncate">{primary}</span>
        </p>
        {isGroup && entry.groupName ? (
          <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
            {entry.groupName}
          </p>
        ) : null}
        {entry.categoryName && entry.categoryName !== programmeCategory ? (
          <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
            {entry.categoryName}
          </p>
        ) : null}
      </div>
      <div className="shrink-0">
        {entry.codeLetter ? (
          <Badge
            variant="outline"
            className="font-mono text-[10px] px-2 py-0.5 border-primary/20 bg-primary/5 text-primary shadow-sm"
          >
            {entry.codeLetter}
          </Badge>
        ) : (
          <span className="text-[10px] italic text-muted-foreground">
            No code
          </span>
        )}
      </div>
    </div>
  );
}
