import type { CohortSummary } from "@team-building-mvp/contracts";

export interface DashboardTotals {
  classCount: number;
  studentCount: number;
  completedCount: number;
  /** Whole-number percent of joined students who finished, or null with no students. */
  completionPercent: number | null;
  teamCount: number;
}

export function summarizeCohorts(cohorts: readonly CohortSummary[]): DashboardTotals {
  const studentCount = cohorts.reduce((sum, cohort) => sum + cohort.studentCount, 0);
  const completedCount = cohorts.reduce((sum, cohort) => sum + cohort.completedCount, 0);
  return {
    classCount: cohorts.length,
    studentCount,
    completedCount,
    completionPercent: studentCount === 0 ? null : Math.round((completedCount / studentCount) * 100),
    teamCount: cohorts.reduce((sum, cohort) => sum + cohort.teamCount, 0),
  };
}

export const STATUS_LABELS: Record<CohortSummary["status"], string> = {
  collecting: "Collecting responses",
  "teams-draft": "Teams in review",
  "teams-locked": "Teams locked",
};

/** The one thing the facilitator should do next for this class. */
export function describeNextStep(cohort: CohortSummary): string {
  if (cohort.status === "teams-locked") return "Export teams and enter grades at the end of the semester.";
  if (cohort.status === "teams-draft") return "Review the suggested teams, swap people if needed, then lock.";
  if (cohort.projectCount === 0) return "Add the projects students will work on.";
  if (cohort.studentCount === 0) return `Share join code ${cohort.joinCode} with your students.`;
  const remaining = cohort.studentCount - cohort.completedCount;
  if (remaining > 0) {
    return `Waiting on ${remaining} ${remaining === 1 ? "student" : "students"} to finish the questionnaires.`;
  }
  return "Everyone's done. Form teams.";
}

/** "a few seconds ago"-style relative date for the class list. */
export function formatCreated(isoDate: string, now: Date = new Date()): string {
  const created = new Date(isoDate);
  const days = Math.floor((now.getTime() - created.getTime()) / 86_400_000);
  if (days <= 0) return "Created today";
  if (days === 1) return "Created yesterday";
  if (days < 30) return `Created ${days} days ago`;
  return `Created ${created.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
}
