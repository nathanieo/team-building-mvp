import { describe, expect, it } from "vitest";
import {
  AGREEMENT_LABELS,
  ARCHETYPE_ORDER,
  ARCHETYPES,
  computePersonality,
  pickArchetypes,
  scoreArchetypes,
  scoreTraits,
  teamBalance,
  WORK_STYLE_ITEMS,
} from "./index.js";
import type { ArchetypeId, QuestionnaireAnswer, TraitId } from "./index.js";

const ITEM_TRAIT: Record<string, TraitId> = {
  extraversion: "extraversion",
  agreeableness: "agreeableness",
  conscientiousness: "conscientiousness",
  neuroticism: "neuroticism",
  intellect: "openness",
};

/** Answers that put each trait at the given level (1–5, after reverse-scoring). */
function answersFor(levels: Record<TraitId, number>): Record<string, QuestionnaireAnswer> {
  return Object.fromEntries(
    WORK_STYLE_ITEMS.map((item) => {
      const level = levels[ITEM_TRAIT[item.trait] ?? "openness"];
      return [item.id, item.reverse ? 6 - level : level];
    }),
  );
}

const MIDDLE = { openness: 3, conscientiousness: 3, extraversion: 3, agreeableness: 3, neuroticism: 3 };

describe("scoreTraits", () => {
  it("scales the six statements per trait to 0–100, flipping reverse-worded ones", () => {
    const traits = scoreTraits(answersFor({ ...MIDDLE, conscientiousness: 5, neuroticism: 1 }));
    // Shown as 95 and 5 rather than 100 and 0: a handful of statements can't justify an absolute.
    expect(traits?.find((trait) => trait.id === "conscientiousness")).toMatchObject({ score: 100, display: 95, band: "high" });
    expect(traits?.find((trait) => trait.id === "neuroticism")).toMatchObject({ score: 0, display: 5, band: "low" });
    expect(traits?.find((trait) => trait.id === "openness")).toMatchObject({ score: 50, band: "middle" });
    // "I make a mess of things." is reverse-worded: answering 1 counts as high conscientiousness.
    const mess = traits?.find((trait) => trait.id === "conscientiousness")?.items.find((item) => item.text === "I make a mess of things.");
    expect(mess).toMatchObject({ answer: 1, scored: 5, reverse: true });
  });

  it("rounds the displayed score to the nearest 5", () => {
    const answers = answersFor(MIDDLE);
    answers["ws-01"] = 4; // one extraversion statement up a notch: 54/100
    const extraversion = scoreTraits(answers)?.find((trait) => trait.id === "extraversion");
    expect(extraversion).toMatchObject({ score: 54, display: 55 });
  });

  it("needs every statement answered", () => {
    const answers = answersFor(MIDDLE);
    delete answers["ws-07"];
    expect(scoreTraits(answers)).toBeNull();
    expect(computePersonality(answers)).toEqual({ status: "incomplete", answered: 29, total: 30 });
    expect(computePersonality({})).toMatchObject({ status: "incomplete", answered: 0 });
  });
});

describe("scoreArchetypes", () => {
  const profiles: Record<ArchetypeId, Record<TraitId, number>> = {
    anchor: { openness: 40, conscientiousness: 85, extraversion: 40, agreeableness: 60, neuroticism: 20 },
    spark: { openness: 70, conscientiousness: 40, extraversion: 90, agreeableness: 60, neuroticism: 40 },
    strategist: { openness: 80, conscientiousness: 85, extraversion: 35, agreeableness: 50, neuroticism: 35 },
    explorer: { openness: 90, conscientiousness: 30, extraversion: 60, agreeableness: 50, neuroticism: 50 },
    harmonizer: { openness: 50, conscientiousness: 55, extraversion: 65, agreeableness: 90, neuroticism: 50 },
    builder: { openness: 40, conscientiousness: 75, extraversion: 75, agreeableness: 50, neuroticism: 25 },
    challenger: { openness: 55, conscientiousness: 75, extraversion: 75, agreeableness: 20, neuroticism: 30 },
    flowkeeper: { openness: 60, conscientiousness: 75, extraversion: 15, agreeableness: 50, neuroticism: 50 },
  };

  it.each(ARCHETYPE_ORDER)("can assign %s from a fitting trait profile", (id) => {
    expect(scoreArchetypes(profiles[id])[0]?.id).toBe(id);
  });

  it("scores a perfectly middling profile at 50 for every archetype", () => {
    const scores = scoreArchetypes({ openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, neuroticism: 50 });
    expect(scores.every((item) => item.score === 50)).toBe(true);
    // Ties keep the fixed order, so the result is still deterministic.
    expect(scores.map((item) => item.id)).toEqual([...ARCHETYPE_ORDER]);
  });
});

describe("pickArchetypes", () => {
  const score = (id: ArchetypeId, value: number) => ({
    id,
    score: value,
    contributions: { openness: 0, conscientiousness: 0, extraversion: 0, agreeableness: 0, neuroticism: 0 },
  });

  it("calls a high, clear lead a strong match with no secondary", () => {
    expect(pickArchetypes([score("anchor", 80), score("builder", 70)])).toEqual({ primary: "anchor", secondary: null, strength: "strong" });
  });

  it("adds a close runner-up as a secondary influence", () => {
    expect(pickArchetypes([score("spark", 70), score("explorer", 66)])).toEqual({ primary: "spark", secondary: "explorer", strength: "clear" });
  });

  it("calls a weak or tied result a blend instead of forcing certainty", () => {
    expect(pickArchetypes([score("anchor", 55), score("flowkeeper", 54)])).toMatchObject({ strength: "blended", secondary: "flowkeeper" });
  });
});

describe("computePersonality", () => {
  const anchorAnswers = answersFor({ openness: 2, conscientiousness: 5, extraversion: 2, agreeableness: 4, neuroticism: 1 });

  it("is deterministic", () => {
    expect(computePersonality(anchorAnswers)).toEqual(computePersonality(anchorAnswers));
  });

  it("builds a full, explained profile", () => {
    const result = computePersonality(anchorAnswers);
    if (result.status !== "complete") throw new Error("expected a complete result");
    expect(result.primary).toBe("anchor");
    expect(result.match.strength).toBe("strong");
    expect(result.insights.length).toBeGreaterThanOrEqual(3);
    expect(result.insights.length).toBeLessThanOrEqual(5);
    expect(result.strengths.length).toBeGreaterThanOrEqual(3);
    expect(result.strengths.length).toBeLessThanOrEqual(4);
    expect(result.blindSpots.length).toBeGreaterThanOrEqual(2);
    expect(result.blindSpots.length).toBeLessThanOrEqual(3);
    expect(result.compatibility.map((item) => item.id)).toEqual(ARCHETYPES.anchor.complements);
    expect(result.idealTeam.suggestions.length).toBeGreaterThan(0);
    expect(result.idealTeam.suggestions.some((item) => item.id === "anchor")).toBe(false);
    // The first reason for The Anchor is its conscientiousness.
    expect(result.insights[0]).toMatchObject({ trait: "conscientiousness", title: "You value follow-through." });
  });

  it("only quotes statements the student actually answered, with the answer they gave", () => {
    const result = computePersonality(anchorAnswers);
    if (result.status !== "complete") throw new Error("expected a complete result");
    for (const insight of result.insights) {
      const quote = insight.evidence.match(/^You marked "(.+)" as "(.+)"\.$/);
      if (!quote) continue;
      const item = WORK_STYLE_ITEMS.find((entry) => entry.text === quote[1]);
      expect(item).toBeDefined();
      const answer = anchorAnswers[item?.id ?? ""];
      expect(AGREEMENT_LABELS[(answer as number) - 1]).toBe(quote[2]);
    }
  });

  it("gives people with the same archetype different intros when their other traits differ", () => {
    const curious = computePersonality(answersFor({ openness: 5, conscientiousness: 5, extraversion: 2, agreeableness: 3, neuroticism: 1 }));
    const warm = computePersonality(answersFor({ openness: 2, conscientiousness: 5, extraversion: 2, agreeableness: 5, neuroticism: 1 }));
    if (curious.status !== "complete" || warm.status !== "complete") throw new Error("expected complete results");
    expect(curious.intro).not.toEqual(warm.intro);
  });

  it("returns an honest blend for answers right in the middle", () => {
    const result = computePersonality(answersFor(MIDDLE));
    if (result.status !== "complete") throw new Error("expected a complete result");
    expect(result.match.strength).toBe("blended");
    expect(result.secondary).not.toBeNull();
    expect(result.insights.some((insight) => insight.title === "Your profile is a blend.")).toBe(true);
  });
});

describe("archetype configuration", () => {
  it.each(ARCHETYPE_ORDER)("%s is complete and consistent", (id) => {
    const archetype = ARCHETYPES[id];
    expect(archetype.id).toBe(id);
    expect(archetype.strengths.length).toBeGreaterThanOrEqual(3);
    expect(archetype.blindSpots).toHaveLength(2);
    expect(archetype.complements).not.toContain(id);
    for (const other of archetype.complements) expect(ARCHETYPE_ORDER).toContain(other);
    for (const weight of Object.values(archetype.weights)) expect(Math.abs(weight)).toBeLessThanOrEqual(1);
  });

  it("works out a team's balance from its members", () => {
    expect(teamBalance(["anchor", "spark"])).toMatchObject({ motivation: 3, accountability: 3, creativity: 2 });
  });
});
