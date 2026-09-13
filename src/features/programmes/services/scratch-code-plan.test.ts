import { describe, expect, it } from "vitest";
import {
  type CheckoutRow,
  compareCodeLetters,
  groupIntoUnits,
  planScratchCodes,
  roundRobinByGroup,
  sequentialAlphabetCode,
  unitKey,
} from "./scratch-code-plan";

function makeRow(overrides: Partial<CheckoutRow> = {}): CheckoutRow {
  return {
    participantId: "p1",
    groupId: null,
    teamNumber: null,
    assignmentMemberId: null,
    reportedAt: "2026-08-10T10:00:00.000Z",
    ...overrides,
  };
}

describe("sequentialAlphabetCode", () => {
  it("walks the alphabet then rolls over", () => {
    expect(sequentialAlphabetCode(1)).toBe("A");
    expect(sequentialAlphabetCode(26)).toBe("Z");
    expect(sequentialAlphabetCode(27)).toBe("AA");
    expect(sequentialAlphabetCode(52)).toBe("AZ");
    expect(sequentialAlphabetCode(53)).toBe("BA");
  });

  it("clamps non-positive input to the first code", () => {
    expect(sequentialAlphabetCode(0)).toBe("A");
    expect(sequentialAlphabetCode(-3)).toBe("A");
  });
});

describe("compareCodeLetters", () => {
  it("sorts single-letter codes alphabetically", () => {
    const list = ["D", "A", "C", "B"];
    expect(list.sort(compareCodeLetters)).toEqual(["A", "B", "C", "D"]);
  });

  it("sorts rollover spreadsheet codes (A..Z before AA..ZZ)", () => {
    const list = ["AA", "B", "Z", "A", "AB", "C", "BA"];
    expect(list.sort(compareCodeLetters)).toEqual([
      "A",
      "B",
      "C",
      "Z",
      "AA",
      "AB",
      "BA",
    ]);
  });

  it("sorts numeric codes naturally", () => {
    const list = ["10", "2", "1", "20"];
    expect(list.sort(compareCodeLetters)).toEqual(["1", "2", "10", "20"]);
  });

  it("sorts alphanumeric codes naturally", () => {
    const list = ["A10", "A2", "A1", "B1"];
    expect(list.sort(compareCodeLetters)).toEqual(["A1", "A2", "A10", "B1"]);
  });

  it("handles null or undefined cleanly", () => {
    const list = ["B", null, "A", undefined];
    expect(list.sort(compareCodeLetters)).toEqual([null, "A", "B", undefined]);
  });
});

describe("unitKey", () => {
  it("keys a team by group and team number", () => {
    expect(unitKey({ groupId: "g1", teamNumber: 2 }, "GROUP")).toBe(
      "team:g1 2",
    );
  });

  it("keys by participant when the programme is individual", () => {
    expect(
      unitKey(
        { participantId: "p1", groupId: "g1", teamNumber: 2 },
        "INDIVIDUAL",
      ),
    ).toBe("solo:p1");
  });

  it("falls back to the participant when team columns are missing", () => {
    expect(
      unitKey(
        { participantId: "p1", groupId: "g1", teamNumber: null },
        "GROUP",
      ),
    ).toBe("solo:p1");
  });
});

describe("groupIntoUnits", () => {
  it("gives every participant their own tile in an individual programme", () => {
    const units = groupIntoUnits(
      [makeRow({ participantId: "p1" }), makeRow({ participantId: "p2" })],
      "INDIVIDUAL",
    );
    expect(units).toHaveLength(2);
    expect(units.map((u) => u.key)).toEqual(["solo:p1", "solo:p2"]);
    expect(units[0]?.recipients).toEqual([
      { participantId: "p1", assignmentMemberId: null },
    ]);
  });

  it("folds a team's members onto one tile", () => {
    const units = groupIntoUnits(
      [
        makeRow({
          participantId: "p1",
          groupId: "g1",
          teamNumber: 1,
          assignmentMemberId: "m1",
        }),
        makeRow({
          participantId: "p2",
          groupId: "g1",
          teamNumber: 1,
          assignmentMemberId: "m2",
        }),
      ],
      "GROUP",
    );
    expect(units).toHaveLength(1);
    expect(units[0]?.key).toBe("team:g1 1");
    expect(units[0]?.participantId).toBeNull();
    expect(units[0]?.recipients).toHaveLength(2);
  });

  it("keeps separate teams from the same group apart", () => {
    const units = groupIntoUnits(
      [
        makeRow({ participantId: "p1", groupId: "g1", teamNumber: 1 }),
        makeRow({ participantId: "p2", groupId: "g1", teamNumber: 2 }),
      ],
      "GROUP",
    );
    expect(units.map((u) => u.key)).toEqual(["team:g1 1", "team:g1 2"]);
  });

  it("takes the earliest checkout time in the unit", () => {
    const units = groupIntoUnits(
      [
        makeRow({
          participantId: "p1",
          groupId: "g1",
          teamNumber: 1,
          reportedAt: "2026-08-10T10:05:00.000Z",
        }),
        makeRow({
          participantId: "p2",
          groupId: "g1",
          teamNumber: 1,
          reportedAt: "2026-08-10T10:01:00.000Z",
        }),
      ],
      "GROUP",
    );
    expect(units[0]?.checkedOutAt).toBe("2026-08-10T10:01:00.000Z");
  });

  it("de-duplicates a participant scanned twice", () => {
    const units = groupIntoUnits(
      [makeRow({ participantId: "p1" }), makeRow({ participantId: "p1" })],
      "INDIVIDUAL",
    );
    expect(units).toHaveLength(1);
    expect(units[0]?.recipients).toHaveLength(1);
  });

  it("drops rows that carry no recipient", () => {
    expect(
      groupIntoUnits([makeRow({ participantId: null })], "INDIVIDUAL"),
    ).toHaveLength(0);
    expect(
      groupIntoUnits(
        [makeRow({ participantId: null, groupId: "g1", teamNumber: 1 })],
        "GROUP",
      ),
    ).toHaveLength(0);
  });
});

describe("planScratchCodes (INDIVIDUAL)", () => {
  const units = groupIntoUnits(
    [
      makeRow({ participantId: "p1", reportedAt: "2026-08-10T10:01:00.000Z" }),
      makeRow({ participantId: "p2", reportedAt: "2026-08-10T10:02:00.000Z" }),
      makeRow({ participantId: "p3", reportedAt: "2026-08-10T10:03:00.000Z" }),
    ],
    "INDIVIDUAL",
  );

  it("gives every unit exactly one code", () => {
    const plan = planScratchCodes(units, "INDIVIDUAL");
    expect(plan).toHaveLength(3);
    expect(new Set(plan.map((a) => a.code)).size).toBe(3);
  });

  it("hands out codes A, B, C in checkout order", () => {
    const plan = planScratchCodes(units, "INDIVIDUAL");
    const byParticipant = new Map(plan.map((a) => [a.participantId, a]));

    expect(byParticipant.get("p1")?.code).toBe("A");
    expect(byParticipant.get("p2")?.code).toBe("B");
    expect(byParticipant.get("p3")?.code).toBe("C");
  });

  it("assigns queue positions 1..N by checkout order", () => {
    const plan = planScratchCodes(units, "INDIVIDUAL");
    const byParticipant = new Map(plan.map((a) => [a.participantId, a]));

    expect(byParticipant.get("p1")?.queuePosition).toBe(1);
    expect(byParticipant.get("p2")?.queuePosition).toBe(2);
    expect(byParticipant.get("p3")?.queuePosition).toBe(3);
  });

  it("assigns contiguous queue positions with no gaps or repeats", () => {
    const many = groupIntoUnits(
      Array.from({ length: 30 }, (_, i) =>
        makeRow({
          participantId: `p${i}`,
          reportedAt: `2026-08-10T10:${String(i).padStart(2, "0")}:00.000Z`,
        }),
      ),
      "INDIVIDUAL",
    );
    const plan = planScratchCodes(many, "INDIVIDUAL");
    expect(plan.map((a) => a.queuePosition).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 30 }, (_, i) => i + 1),
    );
    expect(new Set(plan.map((a) => a.code)).size).toBe(30);
  });

  it("sorts units with no checkout time last but stably", () => {
    const mixed = groupIntoUnits(
      [
        makeRow({ participantId: "p2", reportedAt: null }),
        makeRow({ participantId: "p1", reportedAt: null }),
        makeRow({
          participantId: "p3",
          reportedAt: "2026-08-10T10:01:00.000Z",
        }),
      ],
      "INDIVIDUAL",
    );
    const plan = planScratchCodes(mixed, "INDIVIDUAL");
    const byParticipant = new Map(plan.map((a) => [a.participantId, a]));
    expect(byParticipant.get("p3")?.queuePosition).toBe(1);
    expect(byParticipant.get("p1")?.queuePosition).toBe(2);
    expect(byParticipant.get("p2")?.queuePosition).toBe(3);
  });

  it("returns nothing when nobody checked out", () => {
    expect(planScratchCodes([], "INDIVIDUAL")).toEqual([]);
  });
});

describe("planScratchCodes (GROUP)", () => {
  // Three groups A, B, C each with 2 teams, reported in A1, A2, B1, B2,
  // C1, C2 order.
  const teamUnits = groupIntoUnits(
    [
      makeRow({
        participantId: "pA1",
        groupId: "A",
        teamNumber: 1,
        reportedAt: "2026-08-10T10:01:00.000Z",
      }),
      makeRow({
        participantId: "pA2",
        groupId: "A",
        teamNumber: 2,
        reportedAt: "2026-08-10T10:02:00.000Z",
      }),
      makeRow({
        participantId: "pB1",
        groupId: "B",
        teamNumber: 1,
        reportedAt: "2026-08-10T10:03:00.000Z",
      }),
      makeRow({
        participantId: "pB2",
        groupId: "B",
        teamNumber: 2,
        reportedAt: "2026-08-10T10:04:00.000Z",
      }),
      makeRow({
        participantId: "pC1",
        groupId: "C",
        teamNumber: 1,
        reportedAt: "2026-08-10T10:05:00.000Z",
      }),
      makeRow({
        participantId: "pC2",
        groupId: "C",
        teamNumber: 2,
        reportedAt: "2026-08-10T10:06:00.000Z",
      }),
    ],
    "GROUP",
  );

  it("issues one code per team", () => {
    const plan = planScratchCodes(teamUnits, "GROUP");
    expect(plan).toHaveLength(6);
    expect(plan.every((a) => a.participantId === null)).toBe(true);
    expect(new Set(plan.map((a) => a.code)).size).toBe(6);
  });

  it("round-robins codes across groups so each group gets one letter per cycle", () => {
    const plan = planScratchCodes(teamUnits, "GROUP");
    const byTeam = new Map(
      plan.map((a) => [`${a.groupId}-${a.teamNumber}`, a]),
    );

    // Cycle 1 — A, B, C
    expect(byTeam.get("A-1")?.code).toBe("A");
    expect(byTeam.get("B-1")?.code).toBe("B");
    expect(byTeam.get("C-1")?.code).toBe("C");

    // Cycle 2 — D, E, F
    expect(byTeam.get("A-2")?.code).toBe("D");
    expect(byTeam.get("B-2")?.code).toBe("E");
    expect(byTeam.get("C-2")?.code).toBe("F");
  });

  it("keeps queue position = checkout order, not code order", () => {
    const plan = planScratchCodes(teamUnits, "GROUP");
    const byTeam = new Map(
      plan.map((a) => [`${a.groupId}-${a.teamNumber}`, a]),
    );

    expect(byTeam.get("A-1")?.queuePosition).toBe(1);
    expect(byTeam.get("A-2")?.queuePosition).toBe(2);
    expect(byTeam.get("B-1")?.queuePosition).toBe(3);
    expect(byTeam.get("B-2")?.queuePosition).toBe(4);
    expect(byTeam.get("C-1")?.queuePosition).toBe(5);
    expect(byTeam.get("C-2")?.queuePosition).toBe(6);
  });

  it("falls back to checkout order when there is only one group", () => {
    const singleGroup = groupIntoUnits(
      [
        makeRow({
          participantId: "p1",
          groupId: "X",
          teamNumber: 1,
          reportedAt: "2026-08-10T10:01:00.000Z",
        }),
        makeRow({
          participantId: "p2",
          groupId: "X",
          teamNumber: 2,
          reportedAt: "2026-08-10T10:02:00.000Z",
        }),
        makeRow({
          participantId: "p3",
          groupId: "X",
          teamNumber: 3,
          reportedAt: "2026-08-10T10:03:00.000Z",
        }),
      ],
      "GROUP",
    );
    const plan = planScratchCodes(singleGroup, "GROUP");
    const byTeam = new Map(
      plan.map((a) => [`${a.groupId}-${a.teamNumber}`, a]),
    );
    expect(byTeam.get("X-1")?.code).toBe("A");
    expect(byTeam.get("X-2")?.code).toBe("B");
    expect(byTeam.get("X-3")?.code).toBe("C");
  });

  it("orders groups stably by id when interleaving", () => {
    // Groups reported in C, A, B order — round-robin still walks A, B, C.
    const outOfOrderGroups = groupIntoUnits(
      [
        makeRow({
          participantId: "pC1",
          groupId: "C",
          teamNumber: 1,
          reportedAt: "2026-08-10T10:01:00.000Z",
        }),
        makeRow({
          participantId: "pA1",
          groupId: "A",
          teamNumber: 1,
          reportedAt: "2026-08-10T10:02:00.000Z",
        }),
        makeRow({
          participantId: "pB1",
          groupId: "B",
          teamNumber: 1,
          reportedAt: "2026-08-10T10:03:00.000Z",
        }),
      ],
      "GROUP",
    );
    const plan = planScratchCodes(outOfOrderGroups, "GROUP");
    const byTeam = new Map(
      plan.map((a) => [`${a.groupId}-${a.teamNumber}`, a]),
    );
    expect(byTeam.get("A-1")?.code).toBe("A");
    expect(byTeam.get("B-1")?.code).toBe("B");
    expect(byTeam.get("C-1")?.code).toBe("C");
  });
});

describe("roundRobinByGroup", () => {
  it("returns an empty array for empty input", () => {
    expect(roundRobinByGroup([])).toEqual([]);
  });

  it("returns the single unit untouched", () => {
    const units = [
      {
        key: "team:A 1",
        participantId: null,
        groupId: "A",
        teamNumber: 1,
        recipients: [],
        checkedOutAt: "2026-08-10T10:01:00.000Z",
      },
    ];
    expect(roundRobinByGroup(units)).toEqual(units);
  });
});
