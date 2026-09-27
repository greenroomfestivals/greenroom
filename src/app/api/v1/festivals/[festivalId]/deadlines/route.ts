import "server-only";

import { z } from "zod";

import {
  badRequest,
  forbidden,
  internalError,
  notFound,
  ok,
  unauthorized,
} from "@/api/lib";
import { getSession } from "@/core/auth/session";
import { serverNowIso } from "@/core/datetime/server";
import {
  findFestivalById,
  updateFestival,
} from "@/features/festivals/repositories/festival.repository";

const updateDeadlinesSchema = z.object({
  programmeAssignmentStartDate: z.string().nullable(),
  programmeAssignmentDeadline: z.string().nullable(),
  participantCreationStartDate: z.string().nullable(),
  participantCreationDeadline: z.string().nullable(),
  programmeAssignmentCanAdd: z.boolean(),
  programmeAssignmentCanDelete: z.boolean(),
  participantCreationCanAdd: z.boolean(),
  participantCreationCanEdit: z.boolean(),
});

export const PATCH = async (
  req: Request,
  { params }: { params: Promise<{ festivalId: string }> },
) => {
  const session = await getSession();
  if (!session?.userId) return unauthorized();

  const { festivalId } = await params;

  const existing = await findFestivalById(festivalId);
  if (!existing) {
    return notFound("FESTIVAL_NOT_FOUND", "Festival not found");
  }

  if (existing.ownerId !== session.userId && session.role !== "SUPER_ADMIN") {
    return forbidden();
  }

  const body = await req.json();
  const parsed = updateDeadlinesSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("INVALID_INPUT", parsed.error.message);
  }

  try {
    const updated = await updateFestival(festivalId, {
      ...parsed.data,
      updatedAt: serverNowIso(),
    });

    return ok(updated);
  } catch (error) {
    console.error("[FestivalDeadlinesUpdateError]", error);
    return internalError();
  }
};
