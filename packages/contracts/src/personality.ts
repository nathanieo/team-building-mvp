/**
 * The personality engine: turns a student's Work style answers into trait
 * scores, matches them to the eight archetypes, and builds an explained,
 * personalised profile. Pure and deterministic — the same answers always give
 * the same result — so the result never needs storing; it's derived from the
 * saved answers whenever it's shown. Wording and weights live in
 * personalityContent.ts.
 *
 * The scores come from 20 short statements (four per trait), so they are
 * lightweight indicators of working preferences, not psychological measurements.
 */
import {
  ARCHETYPE_ORDER,
  ARCHETYPES,
  COMMUNICATION_BY_BAND,
  INTRO_MODIFIERS,
  TEAM_DIMENSIONS,
  TRAIT_BLIND_SPOTS,
  TRAIT_INSIGHTS,
  TRAIT_ORDER,
  TRAIT_STRENGTHS,
  TRAIT_TEAM_TEXT,
  TRAITS,
} from "./personalityContent.js";
import type {
  Archetype,
  ArchetypeId,
  BlindSpot,
  Strength,
  TeamDimension,
  TraitBand,
  TraitDirection,
  TraitId,
} from "./personalityContent.js";
import { AGREEMENT_LABELS, WORK_STYLE_ITEMS } from "./questionnaire.js";
import type { BigFiveTrait, QuestionnaireAnswer } from "./questionnaire.js";

/** Bump when the scoring or wording changes in a way that changes results. */
export const PERSONALITY_VERSION = "2026-11-22.1";

/** The Mini-IPIP calls openness "intellect"; everything else matches. */
const TRAIT_FROM_ITEM: Record<BigFiveTrait, TraitId> = {
  extraversion: "extraversion",
  agreeableness: "agreeableness",
  conscientiousness: "conscientiousness",
  neuroticism: "neuroticism",
  intellect: "openness",
};

/** Thresholds, in one place so they're easy to tune. */
export const PERSONALITY_RULES = {
  /** Trait scores below this are "lower", at or above highBand "higher". */
  lowBand: 35,
  highBand: 65,
  /** A strong match needs this score and this lead over the runner-up. */
  strongScore: 72,
  strongLead: 6,
  clearScore: 62,
  clearLead: 3,
  /** A secondary influence is shown within this many points, if it's at least secondaryMinimum. */
  secondaryWithin: 8,
  secondaryMinimum: 55,
  /** Traits closer than this to the middle (on a −1…1 scale) aren't called out as distinctive. */
  distinctive: 0.2,
} as const;

export interface ItemEvidence {
  questionId: string;
  text: string;
  /** What the student picked, 1–5. */
  answer: number;
  answerLabel: string;
  reverse: boolean;
  /** The answer after flipping reverse-worded statements: 5 always means "more of this trait". */
  scored: number;
}

export interface TraitScore {
  id: TraitId;
  name: string;
  /** 0–100, from the average of the trait's statements. */
  score: number;
  /** Rounded to the nearest 5 and kept within 5–95 for display, so it doesn't look falsely precise. */
  display: number;
  band: TraitBand;
  teamText: string;
  items: ItemEvidence[];
}

export interface ArchetypeScore {
  id: ArchetypeId;
  /** 0–100: how well the trait scores line up with this archetype's weights. 50 is neutral. */
  score: number;
  /** How much each trait pushed this archetype up (positive) or down (negative). */
  contributions: Record<TraitId, number>;
}

export type MatchStrength = "strong" | "clear" | "blended";

export interface Insight {
  title: string;
  body: string;
  /** The answer or score behind this insight. */
  evidence: string;
  trait: TraitId | null;
}

export interface Compatibility {
  id: ArchetypeId;
  whyClick: string;
  theyBring: string[];
  youBring: string[];
  focusSession: string;
  friction: string;
  tip: string;
}

export interface IdealTeam {
  dimensions: Array<{ id: TeamDimension; label: string; you: number; withTeam: number }>;
  suggestions: Array<{ id: ArchetypeId; reason: string }>;
}

export interface TeamRole {
  title: string;
  contribute: string;
  communicate: string;
  motivation: string;
  environment: string;
  needs: string;
  expect: string;
}

export type PersonalityResult =
  | { status: "incomplete"; answered: number; total: number }
  | {
      status: "complete";
      version: string;
      answered: number;
      total: number;
      traits: TraitScore[];
      archetypeScores: ArchetypeScore[];
      primary: ArchetypeId;
      secondary: ArchetypeId | null;
      match: { percent: number; strength: MatchStrength; label: string };
      intro: string;
      insights: Insight[];
      strengths: Strength[];
      blindSpots: BlindSpot[];
      team: TeamRole;
      compatibility: Compatibility[];
      idealTeam: IdealTeam;
    };

export function traitBand(score: number): TraitBand {
  if (score < PERSONALITY_RULES.lowBand) return "low";
  if (score >= PERSONALITY_RULES.highBand) return "high";
  return "middle";
}

/** −1 (lowest possible) … 0 (middle) … 1 (highest possible). */
function centred(score: number): number {
  return (score - 50) / 50;
}

function directionOf(score: number): TraitDirection {
  return score >= 50 ? "high" : "low";
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function isScaleAnswer(value: QuestionnaireAnswer | undefined): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5;
}

/**
 * Trait scores from the Work style answers. Returns null if any statement is
 * unanswered, because a trait from fewer statements would be even less reliable.
 */
export function scoreTraits(answers: Record<string, QuestionnaireAnswer>): TraitScore[] | null {
  const byTrait = new Map<TraitId, ItemEvidence[]>();
  for (const item of WORK_STYLE_ITEMS) {
    const answer = answers[item.id];
    if (!isScaleAnswer(answer)) return null;
    const trait = TRAIT_FROM_ITEM[item.trait];
    const evidence: ItemEvidence = {
      questionId: item.id,
      text: item.text,
      answer,
      answerLabel: AGREEMENT_LABELS[answer - 1] ?? String(answer),
      reverse: item.reverse,
      scored: item.reverse ? 6 - answer : answer,
    };
    byTrait.set(trait, [...(byTrait.get(trait) ?? []), evidence]);
  }

  return TRAIT_ORDER.map((id) => {
    const items = byTrait.get(id) ?? [];
    const mean = items.reduce((sum, item) => sum + item.scored, 0) / Math.max(1, items.length);
    const score = Math.round(((mean - 1) / 4) * 100);
    const band = traitBand(score);
    return {
      id,
      name: TRAITS[id].name,
      score,
      // Never shown as 0 or 100: a few statements can't justify an absolute.
      display: Math.min(95, Math.max(5, Math.round(score / 5) * 5)),
      band,
      teamText: TRAIT_TEAM_TEXT[id][band],
      items,
    };
  });
}

/**
 * How well a trait profile fits each archetype: the weighted average of the
 * centred trait scores, scaled to 0–100 (50 = no lean either way). Sorted best
 * first; ties keep the fixed archetype order so results are deterministic.
 */
export function scoreArchetypes(scores: Record<TraitId, number>): ArchetypeScore[] {
  return ARCHETYPE_ORDER.map((id) => {
    const archetype = ARCHETYPES[id];
    let weighted = 0;
    let totalWeight = 0;
    const contributions = {} as Record<TraitId, number>;
    for (const trait of TRAIT_ORDER) {
      const weight = archetype.weights[trait];
      const contribution = weight * centred(scores[trait]);
      contributions[trait] = contribution;
      weighted += contribution;
      totalWeight += Math.abs(weight);
    }
    const raw = totalWeight === 0 ? 0 : weighted / totalWeight;
    return { id, score: Math.round((raw + 1) * 500) / 10, contributions };
  }).sort((a, b) => b.score - a.score || ARCHETYPE_ORDER.indexOf(a.id) - ARCHETYPE_ORDER.indexOf(b.id));
}

/** Primary, optional secondary and how confident to be, from sorted archetype scores. */
export function pickArchetypes(scores: ArchetypeScore[]): {
  primary: ArchetypeId;
  secondary: ArchetypeId | null;
  strength: MatchStrength;
} {
  const [first, second] = scores;
  if (!first) throw new Error("No archetypes to choose from.");
  const lead = second ? first.score - second.score : 100;
  const rules = PERSONALITY_RULES;
  const strength: MatchStrength =
    first.score >= rules.strongScore && lead >= rules.strongLead
      ? "strong"
      : first.score >= rules.clearScore && lead >= rules.clearLead
        ? "clear"
        : "blended";
  const secondary =
    second && (strength === "blended" || (lead <= rules.secondaryWithin && second.score >= rules.secondaryMinimum))
      ? second.id
      : null;
  return { primary: first.id, secondary, strength };
}

/** The statement that most supports a trait pattern, quoted only if the answer clearly points that way. */
function evidenceFor(trait: TraitScore, direction: TraitDirection): string {
  const sorted = [...trait.items].sort((a, b) => (direction === "high" ? b.scored - a.scored : a.scored - b.scored));
  const best = sorted[0];
  const clear = best && (direction === "high" ? best.scored >= 4 : best.scored <= 2);
  if (best && clear) return `You marked "${best.text}" as "${best.answerLabel}".`;
  return `Your ${trait.name.toLowerCase()} came out around ${trait.display} out of 100.`;
}

/** Traits furthest from the middle first: what's most distinctive about this person. */
function distinctiveTraits(traits: TraitScore[]): TraitScore[] {
  return [...traits].sort(
    (a, b) => Math.abs(centred(b.score)) - Math.abs(centred(a.score)) || TRAIT_ORDER.indexOf(a.id) - TRAIT_ORDER.indexOf(b.id),
  );
}

function buildIntro(primary: Archetype, traits: TraitScore[]): string {
  // The archetype's own defining traits are already covered by its intro, so add the next most distinctive one.
  const defining = new Set(
    [...TRAIT_ORDER].sort((a, b) => Math.abs(primary.weights[b]) - Math.abs(primary.weights[a])).slice(0, 2),
  );
  const notable = distinctiveTraits(traits).filter((trait) => Math.abs(centred(trait.score)) >= PERSONALITY_RULES.distinctive);
  const extra = notable.find((trait) => !defining.has(trait.id)) ?? notable[0];
  const modifier = extra
    ? INTRO_MODIFIERS[extra.id][directionOf(extra.score)]
    : "Your answers are fairly balanced across the five traits, so you may adapt your role to whatever each team needs.";
  return `${primary.intro} ${modifier}`;
}

function buildInsights(
  primaryScore: ArchetypeScore,
  secondary: ArchetypeId | null,
  strength: MatchStrength,
  traits: TraitScore[],
): Insight[] {
  const byId = new Map(traits.map((trait) => [trait.id, trait]));
  const insights: Insight[] = [];
  const used = new Set<TraitId>();

  const addTrait = (traitId: TraitId): void => {
    const trait = byId.get(traitId);
    if (!trait || used.has(traitId)) return;
    const direction = directionOf(trait.score);
    const template = TRAIT_INSIGHTS[traitId][direction];
    insights.push({ title: template.title, body: template.body, evidence: evidenceFor(trait, direction), trait: traitId });
    used.add(traitId);
  };

  // 1. The traits that pushed the primary archetype up the most.
  const drivers = [...TRAIT_ORDER]
    .filter((trait) => primaryScore.contributions[trait] > 0.04)
    .sort((a, b) => primaryScore.contributions[b] - primaryScore.contributions[a]);
  for (const trait of drivers.slice(0, 3)) addTrait(trait);

  // 2. Fill up to three with whatever else stands out.
  for (const trait of distinctiveTraits(traits)) {
    if (insights.length >= 3) break;
    if (Math.abs(centred(trait.score)) >= 0.15) addTrait(trait.id);
  }

  // 3. A secondary influence or a blended profile gets its own honest note.
  if (secondary) {
    const other = ARCHETYPES[secondary];
    insights.push({
      title: `There's some of ${other.name} in you too.`,
      body: `Your scores also line up fairly closely with ${other.name}: ${lowerFirst(other.identity)} You may lean into that side depending on the team.`,
      evidence: "Based on how close your match scores were.",
      trait: null,
    });
  }
  if (strength === "blended" || insights.length < 3) {
    insights.push({
      title: "Your profile is a blend.",
      body: "Your scores sit close together across several personalities, so treat this result as a starting point rather than a label. You may shift roles depending on the team and the task.",
      evidence: "Based on how evenly your answers spread across the five traits.",
      trait: null,
    });
  }
  return insights.slice(0, 5);
}

function buildStrengths(primary: Archetype, traits: TraitScore[]): Strength[] {
  const picked: Strength[] = primary.strengths.slice(0, 2);
  for (const trait of distinctiveTraits(traits)) {
    if (picked.length >= 4) break;
    if (Math.abs(centred(trait.score)) < PERSONALITY_RULES.distinctive) continue;
    const strength = TRAIT_STRENGTHS[trait.id]?.[directionOf(trait.score)];
    if (strength && !picked.some((item) => item.name === strength.name)) picked.push(strength);
  }
  for (const strength of primary.strengths) {
    if (picked.length >= 3) break;
    if (!picked.includes(strength)) picked.push(strength);
  }
  return picked.slice(0, 4);
}

function buildBlindSpots(primary: Archetype, traits: TraitScore[]): BlindSpot[] {
  const spots: BlindSpot[] = [...primary.blindSpots.slice(0, 2)];
  const standout = distinctiveTraits(traits)[0];
  if (standout && Math.abs(centred(standout.score)) >= 0.3) {
    const extra = TRAIT_BLIND_SPOTS[standout.id][directionOf(standout.score)];
    if (!spots.some((spot) => spot.name === extra.name)) spots.push(extra);
  }
  return spots.slice(0, 3);
}

function buildTeamRole(primary: Archetype, traits: TraitScore[]): TeamRole {
  const extraversion = traits.find((trait) => trait.id === "extraversion");
  const band = extraversion ? extraversion.band : "middle";
  return { ...primary.role, communicate: `${primary.role.communicate} ${COMMUNICATION_BY_BAND[band]}` };
}

function topDimensions(archetype: Archetype): TeamDimension[] {
  return [...TEAM_DIMENSIONS]
    .sort((a, b) => archetype.dimensions[b.id] - archetype.dimensions[a.id])
    .map((dimension) => dimension.id);
}

function dimensionLabel(id: TeamDimension): string {
  return (TEAM_DIMENSIONS.find((dimension) => dimension.id === id)?.label ?? id).toLowerCase();
}

/** The trait an archetype leans on most, as a phrase ("energised by people and conversation"). */
function signature(archetype: Archetype): string {
  const trait = [...TRAIT_ORDER].sort((a, b) => Math.abs(archetype.weights[b]) - Math.abs(archetype.weights[a]))[0] ?? "conscientiousness";
  return archetype.weights[trait] >= 0 ? TRAITS[trait].high : TRAITS[trait].low;
}

function buildCompatibility(primary: Archetype, traits: TraitScore[]): Compatibility[] {
  const standout = distinctiveTraits(traits)[0];
  const you = standout ? TRAITS[standout.id][directionOf(standout.score)] : "balanced across the traits";
  return primary.complements.map((id) => {
    const other = ARCHETYPES[id];
    const mine = topDimensions(primary)[0] ?? "planning";
    const theirs = topDimensions(other).find((dimension) => dimension !== mine) ?? "motivation";
    return {
      id,
      whyClick:
        `You bring ${lowerFirst(primary.gifts[0])} and ${lowerFirst(primary.gifts[1])}; ${other.name} brings ${lowerFirst(other.gifts[0])} and ${lowerFirst(other.gifts[1])}. ` +
        `Your answers point to someone ${you}, while ${other.name} tends to be ${signature(other)}, so you cover different ground.`,
      theyBring: [...other.gifts],
      youBring: [...primary.gifts],
      focusSession: `In a focus session, you'd likely ${primary.sessionStyle}, while they ${other.sessionStyle}. Together, the session gets both ${dimensionLabel(mine)} and ${dimensionLabel(theirs)}.`,
      friction: `They may ${other.tension}, while you may ${primary.tension}.`,
      tip: other.partnerTip,
    };
  });
}

/** Strongest contribution to each dimension across a set of archetypes: a team's balance. */
export function teamBalance(members: ArchetypeId[]): Record<TeamDimension, number> {
  const balance = {} as Record<TeamDimension, number>;
  for (const dimension of TEAM_DIMENSIONS) {
    balance[dimension.id] = Math.max(0, ...members.map((id) => ARCHETYPES[id].dimensions[dimension.id]));
  }
  return balance;
}

function buildIdealTeam(primary: ArchetypeId, secondary: ArchetypeId | null): IdealTeam {
  const you = teamBalance([primary]);
  if (secondary) {
    // A secondary influence counts a little, but not as much as the primary.
    for (const dimension of TEAM_DIMENSIONS) {
      you[dimension.id] = Math.max(you[dimension.id], ARCHETYPES[secondary].dimensions[dimension.id] - 1);
    }
  }
  const current = { ...you };
  const complements = ARCHETYPES[primary].complements;
  const suggestions: IdealTeam["suggestions"] = [];

  for (let round = 0; round < 3; round += 1) {
    let best: { id: ArchetypeId; gain: number; gains: TeamDimension[] } | null = null;
    for (const id of ARCHETYPE_ORDER) {
      if (id === primary || suggestions.some((item) => item.id === id)) continue;
      const gains = TEAM_DIMENSIONS.map((dimension) => dimension.id)
        .filter((dimension) => ARCHETYPES[id].dimensions[dimension] > current[dimension])
        .sort(
          (a, b) =>
            ARCHETYPES[id].dimensions[b] - current[b] - (ARCHETYPES[id].dimensions[a] - current[a]),
        );
      const gain =
        gains.reduce((sum, dimension) => sum + ARCHETYPES[id].dimensions[dimension] - current[dimension], 0) +
        (complements.includes(id) ? 0.5 : 0);
      if (!best || gain > best.gain) best = { id, gain, gains };
    }
    if (!best || best.gains.length === 0) break;
    const [firstGain, secondGain] = best.gains;
    const describe = (dimension: TeamDimension | undefined): string | null => {
      const info = TEAM_DIMENSIONS.find((item) => item.id === dimension);
      return info ? `${info.label.toLowerCase()} (${info.description})` : null;
    };
    const parts = [describe(firstGain), describe(secondGain)].filter((part): part is string => part !== null);
    suggestions.push({
      id: best.id,
      reason: `${ARCHETYPES[best.id].name} adds ${parts.join(" and ")}, which balances what you already bring.`,
    });
    for (const dimension of TEAM_DIMENSIONS) {
      current[dimension.id] = Math.max(current[dimension.id], ARCHETYPES[best.id].dimensions[dimension.id]);
    }
  }

  return {
    dimensions: TEAM_DIMENSIONS.map((dimension) => ({
      id: dimension.id,
      label: dimension.label,
      you: you[dimension.id],
      withTeam: current[dimension.id],
    })),
    suggestions,
  };
}

const MATCH_LABELS: Record<MatchStrength, string> = {
  strong: "Strong match",
  clear: "Clear match",
  blended: "Blended profile",
};

/** The whole profile from a student's Work style answers. Deterministic: same answers, same result. */
export function computePersonality(answers: Record<string, QuestionnaireAnswer>): PersonalityResult {
  const total = WORK_STYLE_ITEMS.length;
  const answered = WORK_STYLE_ITEMS.filter((item) => isScaleAnswer(answers[item.id])).length;
  const traits = scoreTraits(answers);
  if (!traits) return { status: "incomplete", answered, total };

  const scores = Object.fromEntries(traits.map((trait) => [trait.id, trait.score])) as Record<TraitId, number>;
  const archetypeScores = scoreArchetypes(scores);
  const { primary, secondary, strength } = pickArchetypes(archetypeScores);
  const primaryScore = archetypeScores.find((item) => item.id === primary);
  if (!primaryScore) throw new Error("Primary archetype missing from scores.");
  const archetype = ARCHETYPES[primary];

  return {
    status: "complete",
    version: PERSONALITY_VERSION,
    answered,
    total,
    traits,
    archetypeScores,
    primary,
    secondary,
    match: { percent: Math.round(primaryScore.score), strength, label: MATCH_LABELS[strength] },
    intro: buildIntro(archetype, traits),
    insights: buildInsights(primaryScore, secondary, strength, traits),
    strengths: buildStrengths(archetype, traits),
    blindSpots: buildBlindSpots(archetype, traits),
    team: buildTeamRole(archetype, traits),
    compatibility: buildCompatibility(archetype, traits),
    idealTeam: buildIdealTeam(primary, secondary),
  };
}
