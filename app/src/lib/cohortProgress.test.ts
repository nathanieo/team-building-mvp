import { describe, expect, it } from "vitest";
import type { CohortSummary } from "@team-building-mvp/contracts";
import { describeNextStep, formatCreated, summarizeCohorts } from "./cohortProgress";
import { toApiError } from "./api";

function cohort(overrides: Partial<CohortSummary> = {}): CohortSummary {
  return {
    id: "id",
    name: "CS 665",
    term: null,
    joinCode: "BD8VEF",
    teamSize: 4,
    status: "collecting",
    studentCount: 0,
    completedCount: 0,
    projectCount: 0,
    teamCount: 0,
    createdAt: "2026-11-17T12:00:00.000Z",
    ...overrides,
  };
}

describe("summarizeCohorts", () => {
  it("returns no completion percent when nobody has joined", () => {
    expect(summarizeCohorts([cohort()]).completionPercent).toBeNull();
  });

  it("totals across classes", () => {
    const totals = summarizeCohorts([
      cohort({ studentCount: 10, completedCount: 5, teamCount: 2 }),
      cohort({ studentCount: 2, completedCount: 2, teamCount: 1 }),
    ]);
    expect(totals).toEqual({
      classCount: 2,
      studentCount: 12,
      completedCount: 7,
      completionPercent: 58,
      teamCount: 3,
    });
  });
});

describe("describeNextStep", () => {
  it("walks the MVP flow in order", () => {
    expect(describeNextStep(cohort())).toMatch(/Add the projects/);
    expect(describeNextStep(cohort({ projectCount: 2 }))).toMatch(/Share join code BD8VEF/);
    expect(describeNextStep(cohort({ projectCount: 2, studentCount: 3, completedCount: 2 }))).toBe(
      "Waiting on 1 student to finish the questionnaires.",
    );
    expect(describeNextStep(cohort({ projectCount: 2, studentCount: 3, completedCount: 3 }))).toMatch(/Form teams/);
    expect(describeNextStep(cohort({ status: "teams-draft" }))).toMatch(/Review/);
    expect(describeNextStep(cohort({ status: "teams-locked" }))).toMatch(/Export/);
  });
});

describe("formatCreated", () => {
  const now = new Date("2026-11-17T18:00:00.000Z");
  it("uses relative wording for recent classes", () => {
    expect(formatCreated("2026-11-17T12:00:00.000Z", now)).toBe("Created today");
    expect(formatCreated("2026-11-16T12:00:00.000Z", now)).toBe("Created yesterday");
    expect(formatCreated("2026-11-10T12:00:00.000Z", now)).toBe("Created 7 days ago");
  });
});

describe("toApiError", () => {
  it("keeps the server message and field errors", () => {
    const error = toApiError(400, { error: "Check the highlighted fields.", fieldErrors: { email: "Bad" } });
    expect(error.message).toBe("Check the highlighted fields.");
    expect(error.fieldErrors).toEqual({ email: "Bad" });
  });

  it("explains an unreachable server", () => {
    expect(toApiError(0, null).message).toMatch(/isn't responding/);
    expect(toApiError(502, "<html>").message).toMatch(/isn't responding/);
  });
});
