"use client";

import { format } from "date-fns";
import { Crown, Loader2, Users, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/core/utils/cn";
import {
  getCallListAssignmentsAction,
  toggleParticipantParticipatedAction,
} from "@/features/announcement/actions/announcer.actions";
import type { ActiveReportingProgramme } from "@/features/announcement/services/announcer.service";
import { cancelCallListNotification } from "@/features/schedule/actions/schedule.actions";
import { toast } from "@/lib/toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ActiveReportingProgramme | null;
  festivalId: string;
}

type AssignmentRow = {
  id: string;
  teamNumber: number | null;
  groupName: string | null;
  participantName: string | null;
  chestNumber: string | null;
  codeLetter: string | null;
  isTeamLead: boolean;
  hasReported: boolean;
  hasParticipated: boolean;
  participantGroupName: string | null;
  participantCategoryName: string | null;
};

export function AnnouncerCallListDrawer({
  open,
  onOpenChange,
  item,
  festivalId,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);

  useEffect(() => {
    if (open && item) {
      startTransition(async () => {
        const res = await getCallListAssignmentsAction(
          festivalId,
          item.id,
          item.reportingSessionId,
        );
        if (res.success) {
          setAssignments(res.data);
        } else {
          toast.error(
            (res as { error?: string }).error || "Failed to load assignments",
          );
        }
      });
    } else {
      setAssignments([]);
    }
  }, [open, item, festivalId]);

  // Group assignments by assignment ID to handle group items properly
  const groupedAssignments = assignments.reduce(
    (acc, curr) => {
      if (!acc[curr.id]) {
        acc[curr.id] = {
          id: curr.id,
          teamNumber: curr.teamNumber,
          groupName: curr.groupName,
          hasParticipated: curr.hasParticipated,
          members: [],
        };
      }
      if (curr.participantName) {
        acc[curr.id].members.push({
          name: curr.participantName,
          chestNumber: curr.chestNumber,
          isTeamLead: curr.isTeamLead,
          hasReported: curr.hasReported,
          participantGroupName: curr.participantGroupName,
          participantCategoryName: curr.participantCategoryName,
        });
      }
      if (!acc[curr.id].codeLetter && curr.codeLetter) {
        acc[curr.id].codeLetter = curr.codeLetter;
      }
      return acc;
    },
    {} as Record<
      string,
      {
        id: string;
        teamNumber: number | null;
        groupName: string | null;
        codeLetter?: string | null;
        hasParticipated: boolean;
        members: {
          name: string;
          chestNumber: string | null;
          isTeamLead: boolean;
          hasReported: boolean;
          participantGroupName: string | null;
          participantCategoryName: string | null;
        }[];
      }
    >,
  );

  const handleToggleParticipated = async (
    assignmentId: string,
    newValue: boolean,
  ) => {
    // Optimistic update
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === assignmentId ? { ...a, hasParticipated: newValue } : a,
      ),
    );

    setUpdatingId(assignmentId);

    try {
      const res = await toggleParticipantParticipatedAction(
        festivalId,
        assignmentId,
        newValue,
      );
      if (!res.success) {
        toast.error("Failed to update status");
        // Revert optimistic update
        setAssignments((prev) =>
          prev.map((a) =>
            a.id === assignmentId ? { ...a, hasParticipated: !newValue } : a,
          ),
        );
      }
    } catch (error) {
      toast.error("An error occurred");
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === assignmentId ? { ...a, hasParticipated: !newValue } : a,
        ),
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleManualClose = () => {
    if (item?.scheduleEntryId) {
      startTransition(async () => {
        const res = await cancelCallListNotification(
          festivalId,
          item.scheduleEntryId!,
        );
        if (res.success) {
          toast.success("Removed from call list");
          onOpenChange(false);
        } else {
          toast.error("Failed to remove from call list");
        }
      });
    } else {
      onOpenChange(false); // Just close if no schedule entry
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left border-b pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <DrawerTitle className="text-xl truncate">
                {item?.name}
              </DrawerTitle>
              <DrawerDescription className="mt-1.5 flex items-center gap-2 text-sm flex-wrap">
                <Badge variant="secondary" className="font-normal">
                  {item?.type}
                </Badge>
                {item?.categoryName && <span>{item.categoryName}</span>}
                {item?.stageName && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span>{item.stageName}</span>
                  </>
                )}
              </DrawerDescription>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {item?.startedAt && (
                <div className="text-right">
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Called At
                  </div>
                  <div className="text-xs font-medium text-foreground">
                    {format(new Date(item.startedAt), "h:mm a")}
                  </div>
                </div>
              )}
              <DrawerClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                  aria-label="Close call list"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </div>
        </DrawerHeader>

        <div className="p-4 overflow-y-auto flex-1 min-h-[300px]">
          {isPending ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p>Loading participants...</p>
            </div>
          ) : Object.values(groupedAssignments).length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No participants assigned yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.values(groupedAssignments)
                .sort((a, b) => {
                  if (a.hasParticipated !== b.hasParticipated) {
                    return a.hasParticipated ? 1 : -1;
                  }

                  const aReported = a.members.some((m) => m.hasReported);
                  const bReported = b.members.some((m) => m.hasReported);
                  if (aReported !== bReported) {
                    return aReported ? -1 : 1;
                  }

                  if (a.codeLetter && b.codeLetter) {
                    return a.codeLetter.localeCompare(b.codeLetter);
                  } else if (a.codeLetter) {
                    return -1;
                  } else if (b.codeLetter) {
                    return 1;
                  }

                  if (a.teamNumber && b.teamNumber) {
                    return a.teamNumber - b.teamNumber;
                  }

                  return (
                    a.groupName ||
                    a.members[0]?.name ||
                    ""
                  ).localeCompare(b.groupName || b.members[0]?.name || "");
                })
                .map((assignment, index) => (
                  <div
                    key={assignment.id}
                    className={cn(
                      "border rounded-lg p-4 bg-muted/20 transition-all",
                      assignment.hasParticipated && "opacity-60",
                    )}
                  >
                    {item?.type === "GROUP" ? (
                      <div className="mb-3 flex items-center justify-between border-b pb-2">
                        <div className="font-semibold flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {assignment.groupName ||
                            `Team ${assignment.teamNumber || index + 1}`}
                        </div>
                        <div className="flex gap-2">
                          {assignment.codeLetter && (
                            <Badge variant="secondary" className="font-mono">
                              {assignment.codeLetter}
                            </Badge>
                          )}
                          {assignment.teamNumber && (
                            <Badge variant="outline">
                              Team {assignment.teamNumber}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ) : null}

                    <div className="space-y-2">
                      {assignment.members.map((member, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between"
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{member.name}</span>
                              {item?.type === "INDIVIDUAL" &&
                                assignment.codeLetter && (
                                  <Badge
                                    variant="secondary"
                                    className="font-mono text-[10px] px-1 py-0 h-4"
                                  >
                                    {assignment.codeLetter}
                                  </Badge>
                                )}
                              {member.isTeamLead && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                >
                                  <Crown className="h-3 w-3 mr-1" />
                                  Lead
                                </Badge>
                              )}
                            </div>
                            {(member.participantGroupName ||
                              member.participantCategoryName) && (
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {member.participantGroupName}
                                {member.participantGroupName &&
                                  member.participantCategoryName &&
                                  " • "}
                                {member.participantCategoryName}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-right">
                            {member.chestNumber && (
                              <span className="font-mono text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                {member.chestNumber}
                              </span>
                            )}
                            <Badge
                              variant={
                                member.hasReported ? "default" : "outline"
                              }
                              className={
                                member.hasReported
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50"
                                  : "text-amber-600 border-amber-300 dark:border-amber-700/50"
                              }
                            >
                              {member.hasReported ? "Reported" : "Pending"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 pt-3 border-t flex items-center justify-end">
                      <div className="flex items-center space-x-2">
                        {updatingId === assignment.id && (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                        <Checkbox
                          id={`participated-${assignment.id}`}
                          checked={assignment.hasParticipated}
                          onCheckedChange={(checked) =>
                            handleToggleParticipated(assignment.id, !!checked)
                          }
                          disabled={updatingId === assignment.id}
                        />
                        <label
                          htmlFor={`participated-${assignment.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          Mark as Participated
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <DrawerFooter className="border-t pt-4 flex-row justify-end items-center">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            {item?.scheduleEntryId && (
              <Button
                variant="destructive"
                onClick={handleManualClose}
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Remove from Call List
              </Button>
            )}
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
