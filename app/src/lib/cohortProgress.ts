import type { CohortSummary } from "@team-building-mvp/contracts";

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
