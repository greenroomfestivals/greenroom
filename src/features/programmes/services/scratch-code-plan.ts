/**
 * Pure planning logic for the scratch-to-reveal draw.
 *
 * Kept free of DB access so the two properties that actually matter can be
 * unit tested: every checked-out unit gets exactly one code, and the queue
 * order (checkout scan order) drives both *whose turn it is* and *which
 * code letter they will draw*.
 *
 * Code assignment is deterministic and group-fair:
 *   - INDIVIDUAL: A, B, C in checkout order.
 *   - GROUP: round-robin by group (group order is sorted by group id so the
 *     cycle is stable), with reported order preserved inside each group.
 * So with 3 groups A, B, C of 2 teams each reporting in order
 * A1, A2, B1, B2, C1, C2, the codes come out A, D, B, E, C, F — every
 * group gets one letter before any group sees a second.
 */

export type ProgrammeType = "INDIVIDUAL" | "GROUP";

/** One row of programme_reported_participant, as written during checkout. */
export type CheckoutRow = {
  participantId: string | null;
  groupId: string | null;
  teamNumber: number | null;
  assignmentMemberId: string | null;
  reportedAt: string | null;
};

/** One scratchable tile: a participant (INDIVIDUAL) or a team (GROUP). */
export type CheckoutUnit = {
  key: string;
  participantId: string | null;
  groupId: string | null;
  teamNumber: number | null;
  /** Everyone who receives this tile's code. Multiple members for GROUP. */
  recipients: Array<{
    participantId: string;
    assignmentMemberId: string | null;
  }>;
  /** Earliest checkout timestamp in the unit — drives queue order. */
  checkedOutAt: string | null;
};

export type ScratchCodeAssignment = {
  code: string;
  queuePosition: number;
  participantId: string | null;
  groupId: string | null;
  teamNumber: number | null;
};

export function sequentialAlphabetCode(indexOneBased: number): string {
  let n = Math.max(1, indexOneBased);
  let s = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/**
 * Natural comparator for competition code letters.
 *
 * Correctly orders sequential alphabet codes (A..Z, then AA..ZZ, etc.),
 * numeric codes (1, 2, 10), and alphanumeric codes (A1, A2, A10)
 * rather than naive dictionary sort where "AA" sorts before "B".
 */
export function compareCodeLetters(
  a: string | null | undefined,
  b: string | null | undefined,
): number {
  const strA = (a ?? "").trim();
  const strB = (b ?? "").trim();

  if (strA === strB) return 0;
  if (!strA) return -1;
  if (!strB) return 1;

  // Pure alphabetic codes (e.g. A..Z, then AA..ZZ)
  const isAlphaOnly = /^[A-Za-z]+$/;
  if (isAlphaOnly.test(strA) && isAlphaOnly.test(strB)) {
    if (strA.length !== strB.length) {
      return strA.length - strB.length;
    }
    return strA.localeCompare(strB, undefined, { sensitivity: "base" });
  }

  // Pure numeric codes (e.g. "1", "2", "10")
  const isNumOnly = /^\d+$/;
  if (isNumOnly.test(strA) && isNumOnly.test(strB)) {
    return Number(strA) - Number(strB);
  }

  // Mixed alphanumeric with natural sorting (e.g. "A1", "A2", "A10")
  return strA.localeCompare(strB, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

/**
 * Identity of a scratchable unit. The planner and the read side that turns
 * assignments back into DB rows both build this the same way, so a unit can be
 * matched across the event boundary instead of re-joining on loose columns.
 */
export function unitKey(
  target: {
    participantId?: string | null;
    groupId?: string | null;
    teamNumber?: number | null;
  },
  programmeType: ProgrammeType,
): string {
  const isTeam =
    programmeType === "GROUP" &&
    target.groupId != null &&
    target.teamNumber != null;
  return isTeam
    ? `team:${target.groupId} ${target.teamNumber}`
    : `solo:${target.participantId}`;
}

/** Stable sort by earliest checkout time, then by unit key. */
function sortByCheckout(units: CheckoutUnit[]): CheckoutUnit[] {
  return [...units].sort((a, b) => {
    if (a.checkedOutAt && b.checkedOutAt) {
      if (a.checkedOutAt !== b.checkedOutAt) {
        return a.checkedOutAt < b.checkedOutAt ? -1 : 1;
      }
      return a.key < b.key ? -1 : 1;
    }
    if (a.checkedOutAt) return -1;
    if (b.checkedOutAt) return 1;
    return a.key < b.key ? -1 : 1;
  });
}

/**
 * Collapses reported-participant rows into scratchable units.
 *
 * GROUP programmes fan out one row per team member, so rows are folded back
 * onto (groupId, teamNumber) and the whole team shares one tile. INDIVIDUAL
 * programmes get one tile per participant.
 */
export function groupIntoUnits(
  rows: CheckoutRow[],
  programmeType: ProgrammeType,
): CheckoutUnit[] {
  const byKey = new Map<string, CheckoutUnit>();

  for (const row of rows) {
    const isTeam =
      programmeType === "GROUP" &&
      row.groupId != null &&
      row.teamNumber != null;

    // A row with no participant carries no code recipient and no identity.
    if (!isTeam && !row.participantId) continue;

    const key = unitKey(row, programmeType);
    let unit = byKey.get(key);
    if (!unit) {
      unit = {
        key,
        participantId: isTeam ? null : row.participantId,
        groupId: isTeam ? row.groupId : null,
        teamNumber: isTeam ? row.teamNumber : null,
        recipients: [],
        checkedOutAt: row.reportedAt,
      };
      byKey.set(key, unit);
    }

    if (row.participantId) {
      const already = unit.recipients.some(
        (r) => r.participantId === row.participantId,
      );
      if (!already) {
        unit.recipients.push({
          participantId: row.participantId,
          assignmentMemberId: row.assignmentMemberId,
        });
      }
    }

    // Queue position follows the FIRST scan of the unit.
    if (
      row.reportedAt &&
      (!unit.checkedOutAt || row.reportedAt < unit.checkedOutAt)
    ) {
      unit.checkedOutAt = row.reportedAt;
    }
  }

  return Array.from(byKey.values()).filter((u) => u.recipients.length > 0);
}

/**
 * Interleaves units from each group in a stable round-robin so the i-th code
 * letter goes to the i-th group (sorted by group id). Within a group, units
 * are emitted in their checkout order. Used for GROUP programmes only.
 *
 * Example — three groups A, B, C with units reported in order A1, A2, B1,
 * B2, C1, C2 returns [A1, B1, C1, A2, B2, C2], which the caller will then
 * number A..F so A1 draws A, B1 draws B, C1 draws C, A2 draws D, etc.
 */
export function roundRobinByGroup(units: CheckoutUnit[]): CheckoutUnit[] {
  if (units.length <= 1) return [...units];

  const byGroup = new Map<string, CheckoutUnit[]>();
  for (const unit of units) {
    const groupKey = unit.groupId ?? "__solo__";
    const bucket = byGroup.get(groupKey);
    if (bucket) bucket.push(unit);
    else byGroup.set(groupKey, [unit]);
  }
  for (const bucket of byGroup.values()) {
    bucket.sort((a, b) => {
      if (a.checkedOutAt && b.checkedOutAt) {
        if (a.checkedOutAt !== b.checkedOutAt) {
          return a.checkedOutAt < b.checkedOutAt ? -1 : 1;
        }
        return a.key < b.key ? -1 : 1;
      }
      if (a.checkedOutAt) return -1;
      if (b.checkedOutAt) return 1;
      return a.key < b.key ? -1 : 1;
    });
  }

  // Sort groups by id (with solo units always last) so the cycle is stable
  // across re-renders and re-runs.
  const groupOrder = Array.from(byGroup.keys()).sort((a, b) => {
    if (a === "__solo__") return 1;
    if (b === "__solo__") return -1;
    return a < b ? -1 : 1;
  });

  const result: CheckoutUnit[] = [];
  let progressed = true;
  while (progressed) {
    progressed = false;
    for (const groupKey of groupOrder) {
      const next = byGroup.get(groupKey)!.shift();
      if (next) {
        result.push(next);
        progressed = true;
      }
    }
  }
  return result;
}

/**
 * Assigns each unit a queue position (checkout scan order) and a code letter.
 *
 * For `INDIVIDUAL` programmes the code is just the unit's index in checkout
 * order — the 1st reported participant draws `A`, the 2nd draws `B`, etc.
 *
 * For `GROUP` programmes the code is handed out in a round-robin across
 * groups, so every group gets one letter before any group sees a second:
 *
 *   report order:  A1, B1, C1, A2, B2, C2
 *   codes handed:  A,  B,  C,  D,  E,  F
 *
 * `queuePosition` is always "your place in the reported list" — it is
 * independent from the *value* of the code, but deterministic and not random.
 * That way the reveal surface still says "participant X is up next", and the
 * tile they scratch carries the code that was deterministically assigned to
 * their group / report slot.
 */
export function planScratchCodes(
  units: CheckoutUnit[],
  programmeType: ProgrammeType,
): ScratchCodeAssignment[] {
  const queued = sortByCheckout(units);

  const queuePositionByKey = new Map<string, number>();
  queued.forEach((unit, index) => {
    queuePositionByKey.set(unit.key, index + 1);
  });

  const drawOrder =
    programmeType === "GROUP" ? roundRobinByGroup(queued) : queued;

  return drawOrder.map((unit, index) => ({
    code: sequentialAlphabetCode(index + 1),
    queuePosition: queuePositionByKey.get(unit.key) as number,
    participantId: unit.participantId,
    groupId: unit.groupId,
    teamNumber: unit.teamNumber,
  }));
}
