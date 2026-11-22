import { describe, expect, it } from "vitest";
import {
  buildSkillsQuestionnaire,
  buildWorkStyleQuestionnaire,
  countAnswered,
  firstUnanswered,
  isValidAnswer,
  WORK_STYLE_ITEMS,
} from "./index.js";

const projects = [
  { id: "p1", label: "Campus navigation app" },
  { id: "p2", label: "Food bank tracker" },
  { id: "p3", label: "Study group matcher" },
  { id: "p4", label: "Course review site" },
];

describe("questionnaires", () => {
  it("adds up to 40 questions for a class with projects", () => {
    expect(buildWorkStyleQuestionnaire().questions.length + buildSkillsQuestionnaire(projects).questions.length).toBe(40);
  });

  it("has 30 work-style items, six per Big Five trait", () => {
    expect(buildWorkStyleQuestionnaire().questions).toHaveLength(30);
    const perTrait = new Map<string, number>();
    for (const item of WORK_STYLE_ITEMS) perTrait.set(item.trait, (perTrait.get(item.trait) ?? 0) + 1);
    expect([...perTrait.values()]).toEqual([6, 6, 6, 6, 6]);
  });

  it("adds the project ranking only when the class has projects", () => {
    expect(buildSkillsQuestionnaire(projects).questions).toHaveLength(10);
    expect(buildSkillsQuestionnaire([]).questions).toHaveLength(9);
    const rank = buildSkillsQuestionnaire(projects.slice(0, 2)).questions.at(-1);
    expect(rank).toMatchObject({ kind: "rank", pick: 2 });
  });

  it("checks answers against each question", () => {
    const [scale] = buildWorkStyleQuestionnaire().questions;
    const rank = buildSkillsQuestionnaire(projects).questions.at(-1);
    if (!scale || !rank) throw new Error("missing questions");
    expect(isValidAnswer(scale, 3)).toBe(true);
    expect(isValidAnswer(scale, 6)).toBe(false);
    expect(isValidAnswer(scale, 2.5)).toBe(false);
    expect(isValidAnswer(rank, ["p2", "p1", "p4"])).toBe(true);
    expect(isValidAnswer(rank, ["p2", "p2", "p4"])).toBe(false);
    expect(isValidAnswer(rank, ["p2", "p1"])).toBe(false);
    expect(isValidAnswer(rank, ["p2", "p1", "nope"])).toBe(false);
  });

  it("finds where to resume and counts answers", () => {
    const work = buildWorkStyleQuestionnaire();
    const answers = { "ws-01": 4, "ws-02": 5, "ws-04": 2 };
    expect(countAnswered(work, answers)).toBe(3);
    expect(firstUnanswered(work, answers)).toBe(2);
    const all = Object.fromEntries(work.questions.map((question) => [question.id, 3]));
    expect(firstUnanswered(work, all)).toBe(30);
  });
});
