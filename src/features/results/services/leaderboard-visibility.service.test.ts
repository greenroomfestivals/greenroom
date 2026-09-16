import { describe, expect, it } from "vitest";
import {
  filterResultsForLeaderboard,
  isResultVisibleForLeaderboard,
} from "./leaderboard-visibility.service";

const row = (published: boolean) => ({
  isPublished: published,
});

describe("isResultVisibleForLeaderboard", () => {
  it("BASIC standings: allows all submitted", () => {
    expect(isResultVisibleForLeaderboard(row(true), "BASIC", "standings")).toBe(
      true,
    );
    expect(
      isResultVisibleForLeaderboard(row(false), "BASIC", "standings"),
    ).toBe(true);
    expect(isResultVisibleForLeaderboard(row(true), "BASIC", "desk")).toBe(
      false,
    );
    expect(isResultVisibleForLeaderboard(row(true), "BASIC", "onAir")).toBe(
      false,
    );
  });

  it("Standard desk: allows all submitted", () => {
    expect(isResultVisibleForLeaderboard(row(true), "STANDARD", "desk")).toBe(
      true,
    );
    expect(isResultVisibleForLeaderboard(row(false), "STANDARD", "desk")).toBe(
      true,
    );
  });

  it("Standard onAir: allows all submitted", () => {
    expect(isResultVisibleForLeaderboard(row(true), "STANDARD", "onAir")).toBe(
      true,
    );
    expect(isResultVisibleForLeaderboard(row(false), "STANDARD", "onAir")).toBe(
      true,
    );
  });
});

describe("filterResultsForLeaderboard", () => {
  const results = [row(false), row(true), row(true)];

  it("filters BASIC to submitted rows only (all rows)", () => {
    expect(filterResultsForLeaderboard(results, "BASIC", "standings")).toEqual([
      row(false),
      row(true),
      row(true),
    ]);
  });

  it("filters Standard onAir to submitted rows (all rows)", () => {
    expect(filterResultsForLeaderboard(results, "STANDARD", "onAir")).toEqual([
      row(false),
      row(true),
      row(true),
    ]);
  });
});
