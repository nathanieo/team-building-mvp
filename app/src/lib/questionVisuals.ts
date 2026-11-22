import type { MascotScene } from "../components/Mascot";

/**
 * How each question looks: the topic (which sets the page's soft background
 * colour) and what Sprout acts out. Scenes illustrate the question itself and
 * never change with the answer, so the mascot can't nudge anyone's choice.
 */
export type QuestionTopic = "social" | "caring" | "organised" | "feelings" | "imagination" | "skills" | "projects";

export interface QuestionVisual extends MascotScene {
  topic: QuestionTopic;
}

const VISUALS: Record<string, QuestionVisual> = {
  // Work style (Mini-IPIP)
  "ws-01": { topic: "social", mood: "excited", prop: "party", motion: "dance" },
  "ws-02": { topic: "caring", mood: "warm", prop: "heart", motion: "float" },
  "ws-03": { topic: "organised", mood: "happy", prop: "checklist", motion: "nod" },
  "ws-04": { topic: "feelings", mood: "thinking", prop: "sunCloud", motion: "sway" },
  "ws-05": { topic: "imagination", mood: "calm", prop: "dream", motion: "float" },
  "ws-06": { topic: "social", mood: "shy", prop: "dots", motion: "sway" },
  "ws-07": { topic: "caring", mood: "thinking", prop: "shrug", motion: "wiggle" },
  "ws-08": { topic: "organised", mood: "oops", prop: "socks", motion: "wiggle" },
  "ws-09": { topic: "feelings", mood: "calm", prop: "sunglasses", motion: "sway" },
  "ws-10": { topic: "imagination", mood: "thinking", prop: "lightbulb", motion: "float" },
  "ws-11": { topic: "social", mood: "excited", prop: "friends", motion: "bounce" },
  "ws-12": { topic: "caring", mood: "warm", prop: "hearts", motion: "float" },
  "ws-13": { topic: "organised", mood: "happy", prop: "blocks", motion: "nod" },
  "ws-14": { topic: "feelings", mood: "worried", prop: "rain", motion: "wiggle" },
  "ws-15": { topic: "imagination", mood: "thinking", prop: "puzzle", motion: "sway" },
  "ws-16": { topic: "social", mood: "shy", prop: "peek", motion: "sway" },
  "ws-17": { topic: "caring", mood: "calm", prop: "headphones", motion: "sway" },
  "ws-18": { topic: "organised", mood: "oops", prop: "paint", motion: "wiggle" },
  "ws-19": { topic: "feelings", mood: "happy", prop: "sun", motion: "bounce" },
  "ws-20": { topic: "imagination", mood: "thinking", prop: "emptyThought", motion: "float" },
  "ws-21": { topic: "social", mood: "excited", prop: "chatter", motion: "bounce" },
  "ws-22": { topic: "caring", mood: "warm", prop: "hearts", motion: "float" },
  "ws-23": { topic: "organised", mood: "focused", prop: "calendar", motion: "nod" },
  "ws-24": { topic: "feelings", mood: "worried", prop: "sunCloud", motion: "wiggle" },
  "ws-25": { topic: "imagination", mood: "excited", prop: "lightbulb", motion: "bounce" },
  "ws-26": { topic: "social", mood: "shy", prop: "peek", motion: "sway" },
  "ws-27": { topic: "caring", mood: "warm", prop: "heart", motion: "float" },
  "ws-28": { topic: "organised", mood: "oops", prop: "socks", motion: "wiggle" },
  "ws-29": { topic: "feelings", mood: "thinking", prop: "rain", motion: "sway" },
  "ws-30": { topic: "imagination", mood: "calm", prop: "books", motion: "float" },
  // Skills and project interests
  "sk-frontend": { topic: "skills", mood: "focused", prop: "laptop", motion: "nod" },
  "sk-backend": { topic: "skills", mood: "focused", prop: "gears", motion: "sway" },
  "sk-data": { topic: "skills", mood: "focused", prop: "chart", motion: "nod" },
  "sk-design": { topic: "skills", mood: "happy", prop: "palette", motion: "wiggle" },
  "sk-writing": { topic: "skills", mood: "focused", prop: "pencil", motion: "sway" },
  "sk-planning": { topic: "skills", mood: "happy", prop: "calendar", motion: "nod" },
  "sk-testing": { topic: "skills", mood: "thinking", prop: "magnifier", motion: "sway" },
  "sk-presenting": { topic: "skills", mood: "excited", prop: "microphone", motion: "bounce" },
  "sk-research": { topic: "skills", mood: "thinking", prop: "books", motion: "float" },
  "sk-projects": { topic: "projects", mood: "excited", prop: "rocket", motion: "bounce" },
};

const FALLBACK: QuestionVisual = { topic: "skills", mood: "happy", prop: "sun", motion: "float" };

export function visualFor(questionId: string): QuestionVisual {
  return VISUALS[questionId] ?? FALLBACK;
}

/** The finish screen: a little celebration. */
export const DONE_VISUAL: QuestionVisual = { topic: "imagination", mood: "excited", prop: "party", motion: "dance" };
