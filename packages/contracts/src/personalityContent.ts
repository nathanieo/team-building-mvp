/**
 * Everything the personality profile *says*: the five traits, the eight
 * archetypes (their trait weights, wording, team role and compatibility),
 * and the trait-based snippets that personalise each result.
 *
 * Edit wording or weights here; the scoring engine in personality.ts reads
 * this configuration and doesn't need to change.
 */

export type TraitId = "openness" | "conscientiousness" | "extraversion" | "agreeableness" | "neuroticism";
export type TraitDirection = "high" | "low";
export type TraitBand = "low" | "middle" | "high";

export const TRAIT_ORDER: readonly TraitId[] = [
  "openness",
  "conscientiousness",
  "extraversion",
  "agreeableness",
  "neuroticism",
];

export const TRAITS: Record<TraitId, { name: string; plain: string; high: string; low: string }> = {
  openness: {
    name: "Openness",
    plain: "curiosity and new ideas",
    high: "curious and open to new ideas",
    low: "practical and grounded in what works",
  },
  conscientiousness: {
    name: "Conscientiousness",
    plain: "organisation and follow-through",
    high: "organised and focused on follow-through",
    low: "flexible and comfortable improvising",
  },
  extraversion: {
    name: "Extraversion",
    plain: "social energy",
    high: "energised by people and conversation",
    low: "energised by quiet, focused time",
  },
  agreeableness: {
    name: "Agreeableness",
    plain: "cooperation and empathy",
    high: "cooperative and tuned in to others",
    low: "direct and comfortable with disagreement",
  },
  neuroticism: {
    name: "Neuroticism",
    plain: "sensitivity to stress",
    high: "quick to notice pressure and risks",
    low: "steady and calm under pressure",
  },
};

/** What a score band may mean in a team, per trait. Shown in the Big 5 breakdown. */
export const TRAIT_TEAM_TEXT: Record<TraitId, Record<TraitBand, string>> = {
  openness: {
    high: "You seem drawn to new ideas and unusual angles. In a team, you may be the one who asks \"what if we tried it another way?\" when the first plan stalls.",
    middle: "You seem open to new ideas when they're useful, without chasing novelty for its own sake. You can likely help a team weigh fresh options against proven ones.",
    low: "You seem to prefer approaches that are known to work. In a team, that practical streak can keep good ideas realistic and stop the group from reinventing things.",
  },
  conscientiousness: {
    high: "You tend to value structure and follow-through. In a team, you may be the person who remembers the deadline and makes sure things actually get finished.",
    middle: "You seem to balance planning with flexibility. You can probably keep track of what matters without needing every detail decided up front.",
    low: "You seem comfortable improvising and adapting as you go. In a team, that flexibility helps when plans change, especially alongside someone who tracks the details.",
  },
  extraversion: {
    high: "You seem to draw energy from people. In a team, you may be the one who starts the conversation, keeps it going and makes others feel included.",
    middle: "You seem comfortable both speaking up and listening. You can likely adjust to what the group needs, whether that's a push or some quiet focus.",
    low: "You seem to recharge with quieter, focused time. In a team, you may contribute most through careful thinking and well-prepared work rather than talking first.",
  },
  agreeableness: {
    high: "You seem to care about how everyone in the group is doing. In a team, you may notice when someone's left out and help keep things cooperative.",
    middle: "You seem to balance being supportive with being honest. You can likely help a team stay friendly without avoiding the hard questions.",
    low: "You seem comfortable being direct and questioning ideas. In a team, that candour can keep quality high and stop a group from agreeing too quickly.",
  },
  neuroticism: {
    high: "You seem to notice pressure and risks early. In a team, that sensitivity can catch problems before they grow, though deadlines may feel heavier for you.",
    middle: "You seem to feel pressure at times but usually keep it in proportion. You can likely stay steady in most situations while still taking problems seriously.",
    low: "You seem to stay calm when things get stressful. In a team, you may be a steadying presence when deadlines get close or plans go sideways.",
  },
};

/** "Why you got this personality" insights, keyed by the trait pattern behind them. */
export const TRAIT_INSIGHTS: Record<TraitId, Record<TraitDirection, { title: string; body: string }>> = {
  openness: {
    high: { title: "You're drawn to new ideas.", body: "Your answers suggest curiosity and imagination come naturally to you, and that you enjoy exploring possibilities." },
    low: { title: "You value what works in practice.", body: "Your answers suggest you prefer concrete, proven approaches over abstract ones." },
  },
  conscientiousness: {
    high: { title: "You value follow-through.", body: "Your answers suggest keeping things in order and finishing what you start matter to you." },
    low: { title: "You keep things flexible.", body: "Your answers suggest you're comfortable improvising rather than following a fixed routine." },
  },
  extraversion: {
    high: { title: "People give you energy.", body: "Your answers suggest you enjoy being around others and don't mind being in the middle of things." },
    low: { title: "You do your best thinking in quieter moments.", body: "Your answers suggest you prefer listening and focused time over being the centre of attention." },
  },
  agreeableness: {
    high: { title: "You tune in to how others feel.", body: "Your answers suggest empathy and cooperation are a big part of how you work with people." },
    low: { title: "You're comfortable being direct.", body: "Your answers suggest you'd rather say what you think than smooth things over." },
  },
  neuroticism: {
    high: { title: "You notice pressure early.", body: "Your answers suggest you feel stress and setbacks keenly, which can also make you alert to risks." },
    low: { title: "You tend to stay steady.", body: "Your answers suggest you're relaxed most of the time and not easily thrown by pressure." },
  },
};

/** One extra sentence for the intro, from the user's most distinctive trait, so two people with the same archetype read different text. */
export const INTRO_MODIFIERS: Record<TraitId, Record<TraitDirection, string>> = {
  openness: {
    high: "Your curiosity also means you're likely to suggest a new angle when the usual approach stalls.",
    low: "Your practical streak also helps keep the team's ideas grounded in what will actually work.",
  },
  conscientiousness: {
    high: "Your sense of follow-through means plans are less likely to fall through the cracks with you around.",
    low: "Your flexibility also means you can roll with it when plans change at the last minute.",
  },
  extraversion: {
    high: "Your social energy also makes it easier for a new group to get comfortable and start talking.",
    low: "Your preference for focused time also means you often bring well-thought-through work to the table.",
  },
  agreeableness: {
    high: "Your care for others also helps teammates feel heard, especially when opinions differ.",
    low: "Your directness also means the team gets honest feedback when it matters.",
  },
  neuroticism: {
    high: "Your alertness to pressure also means you may spot risks before others do.",
    low: "Your calm also helps the group keep perspective when a deadline gets close.",
  },
};

export interface Strength {
  name: string;
  explanation: string;
  benefit: string;
  example: string;
}

export interface BlindSpot {
  name: string;
  howItShows: string;
  tryThis: string;
}

/** Strengths that come from a single trait pattern, mixed in with the archetype's own. */
export const TRAIT_STRENGTHS: Partial<Record<TraitId, Partial<Record<TraitDirection, Strength>>>> = {
  openness: {
    high: {
      name: "Fresh perspectives",
      explanation: "You seem to enjoy looking at problems from new angles.",
      benefit: "Teams get options beyond the first obvious idea.",
      example: "When a brainstorm goes quiet, you may be the one who asks what would happen if you flipped the problem around.",
    },
  },
  conscientiousness: {
    high: {
      name: "Dependable follow-through",
      explanation: "Your answers point to a habit of finishing what you start.",
      benefit: "Teams can trust that tasks with your name on them will get done.",
      example: "The night before a deadline, you're more likely to be polishing than starting.",
    },
  },
  extraversion: {
    high: {
      name: "Getting people talking",
      explanation: "You seem comfortable starting conversations and keeping them going.",
      benefit: "New groups warm up faster and quieter members get pulled in.",
      example: "In a first meeting, you may be the one who breaks the silence with introductions.",
    },
    low: {
      name: "Thoughtful contributions",
      explanation: "You seem to think things through before sharing them.",
      benefit: "Your ideas tend to arrive well-formed rather than half-baked.",
      example: "After a quiet meeting, you might send the message that sums up what the group actually decided.",
    },
  },
  agreeableness: {
    high: {
      name: "Building trust",
      explanation: "You seem tuned in to how others are feeling.",
      benefit: "People feel safer sharing ideas and admitting when they're stuck.",
      example: "You may check in with a teammate who's gone quiet, before the problem gets bigger.",
    },
    low: {
      name: "Honest feedback",
      explanation: "You seem willing to say what others might only think.",
      benefit: "Weak ideas get questioned early, when they're cheap to fix.",
      example: "In a review, you may be the one to point out the gap everyone else noticed but didn't mention.",
    },
  },
  neuroticism: {
    low: {
      name: "Calm under pressure",
      explanation: "You seem to stay steady when things get stressful.",
      benefit: "The team keeps its focus instead of spiralling when something goes wrong.",
      example: "When a demo breaks an hour before presenting, you may be the one who says \"okay, what can we fix now?\"",
    },
    high: {
      name: "Early warning system",
      explanation: "You seem to notice risks and pressure before others do.",
      benefit: "Problems get flagged while there's still time to deal with them.",
      example: "You may be first to ask whether the plan really fits in the time left.",
    },
  },
};

/** Constructive blind spots that come from a single trait pattern. Possibilities, not verdicts. */
export const TRAIT_BLIND_SPOTS: Record<TraitId, Record<TraitDirection, BlindSpot>> = {
  openness: {
    high: {
      name: "New ideas can pull you off course",
      howItShows: "Because exploring is fun for you, a new idea might feel more exciting than finishing the current one.",
      tryThis: "Keep a \"later\" list. Park new ideas there and revisit them once the current task is done.",
    },
    low: {
      name: "Untested ideas might get dismissed early",
      howItShows: "Because you value what works, an unfamiliar idea may sound riskier to you than it really is.",
      tryThis: "Before ruling an idea out, ask for one small way to test it quickly.",
    },
  },
  conscientiousness: {
    high: {
      name: "High standards can slow you down",
      howItShows: "Wanting things done properly may mean you polish details the team doesn't need yet.",
      tryThis: "Agree on what \"done\" means for each task before starting, so good enough can be good enough.",
    },
    low: {
      name: "Details can slip",
      howItShows: "Because you like to stay flexible, smaller tasks and deadlines might get lost along the way.",
      tryThis: "Keep a shared checklist with dates, and glance at it at the start of each session.",
    },
  },
  extraversion: {
    high: {
      name: "You might fill the silence",
      howItShows: "Because talking things through comes easily, quieter teammates may not get a word in.",
      tryThis: "After sharing your idea, ask someone who hasn't spoken yet what they think.",
    },
    low: {
      name: "Your ideas may stay unheard",
      howItShows: "Because you prefer to think first, good ideas might not reach the group in time.",
      tryThis: "Share ideas in writing before or after meetings, or ask for a minute to think and then speak.",
    },
  },
  agreeableness: {
    high: {
      name: "Saying yes too often",
      howItShows: "Because you care about keeping everyone happy, you may agree to more than is fair or hold back disagreement.",
      tryThis: "When asked for something, it's okay to say \"let me check what I already have on\" before agreeing.",
    },
    low: {
      name: "Directness can land harder than intended",
      howItShows: "Honest feedback is valuable, but it may sound harsher to others than it does to you.",
      tryThis: "Start with what's working, then name one specific thing to improve.",
    },
  },
  neuroticism: {
    high: {
      name: "Pressure can build up quietly",
      howItShows: "Because you feel stress keenly, a tight deadline may weigh on you more than others realise.",
      tryThis: "Break big tasks into small steps and tell the team early if something feels off track.",
    },
    low: {
      name: "You might miss when others are stressed",
      howItShows: "Because pressure doesn't rattle you much, you may not notice when it's weighing on a teammate.",
      tryThis: "Near a deadline, ask the group how everyone is feeling about the workload.",
    },
  },
};

/** How a person may communicate, by their extraversion band. Added to the team-role section. */
export const COMMUNICATION_BY_BAND: Record<TraitBand, string> = {
  high: "You probably think out loud and keep the conversation moving.",
  middle: "You can likely switch between listening and speaking up, depending on what the group needs.",
  low: "You may prefer to think things through first and share when your idea is ready.",
};

export type TeamDimension = "planning" | "execution" | "motivation" | "creativity" | "focus" | "accountability" | "harmony";

export const TEAM_DIMENSIONS: ReadonlyArray<{ id: TeamDimension; label: string; description: string }> = [
  { id: "planning", label: "Planning", description: "turning goals into a clear plan" },
  { id: "execution", label: "Execution", description: "turning plans into finished work" },
  { id: "motivation", label: "Motivation", description: "getting the team started and keeping energy up" },
  { id: "creativity", label: "Creativity", description: "bringing new ideas and approaches" },
  { id: "focus", label: "Focus", description: "sustained, careful concentration" },
  { id: "accountability", label: "Accountability", description: "keeping standards and commitments" },
  { id: "harmony", label: "Team harmony", description: "keeping trust and cooperation strong" },
];

export type ArchetypeId =
  | "anchor"
  | "spark"
  | "strategist"
  | "explorer"
  | "harmonizer"
  | "builder"
  | "challenger"
  | "flowkeeper";

export interface Archetype {
  id: ArchetypeId;
  name: string;
  identity: string;
  tagline: string;
  /** Two sentences opening the reveal; a trait-based sentence is added per person. */
  intro: string;
  /**
   * How much each trait pulls toward this archetype, from −1 to 1. Positive
   * means a high score fits; negative means a low score fits; 0 means it
   * doesn't matter. See scoreArchetypes() in personality.ts.
   */
  weights: Record<TraitId, number>;
  strengths: Strength[];
  blindSpots: BlindSpot[];
  role: {
    title: string;
    contribute: string;
    communicate: string;
    motivation: string;
    environment: string;
    needs: string;
    expect: string;
  };
  /** Short noun phrases for what they bring a partner. */
  gifts: [string, string, string];
  /** Verb phrase: how they work in a focus session ("you …"). */
  sessionStyle: string;
  /** Verb phrase: a habit that can cause friction ("may …"). */
  tension: string;
  /** Advice for working with this archetype. */
  partnerTip: string;
  complements: [ArchetypeId, ArchetypeId];
  /** What this archetype tends to add to a team, 0–3. */
  dimensions: Record<TeamDimension, number>;
}

export const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  anchor: {
    id: "anchor",
    name: "The Anchor",
    identity: "The steady and dependable teammate.",
    tagline: "You're the person people can count on when motivation runs out.",
    intro: "You may not always be the loudest person in the room, but you're often the one who keeps things moving when others lose momentum. Steady progress matters more to you than bursts of excitement.",
    weights: { openness: -0.3, conscientiousness: 1, extraversion: -0.3, agreeableness: 0.3, neuroticism: -0.8 },
    strengths: [
      {
        name: "Consistency",
        explanation: "You seem to show up the same way every time, whether the work is exciting or not.",
        benefit: "The team has a reliable baseline to build on.",
        example: "Weeks into a project, when the novelty has worn off, you're still putting in steady hours.",
      },
      {
        name: "Keeping teams grounded",
        explanation: "You seem to bring calm and realism when things get chaotic.",
        benefit: "The group keeps perspective instead of overreacting.",
        example: "When the team panics about a bug, you may be the one who says \"let's list what we know\".",
      },
      {
        name: "Patient responsibility",
        explanation: "You seem willing to own tasks and see them through.",
        benefit: "Fewer things fall through the cracks.",
        example: "You notice nobody has booked the presentation room, so you just do it.",
      },
    ],
    blindSpots: [
      {
        name: "You might take on too much",
        howItShows: "Because you value reliability, you may end up carrying responsibilities that should be shared.",
        tryThis: "Agree on who does what at the start of a session instead of assuming you need to handle everything.",
      },
      {
        name: "Change can feel uncomfortable",
        howItShows: "When the plan shifts late, you may lean toward the familiar route even when a new one is better.",
        tryThis: "When a change is proposed, ask what problem it solves before deciding.",
      },
    ],
    role: {
      title: "The stabiliser",
      contribute: "You bring consistency when the group gets distracted, and help make sure goals don't get forgotten after the initial excitement.",
      communicate: "You tend to communicate calmly and clearly, often keeping the group focused on what's next.",
      motivation: "Steady, visible progress and knowing your work makes a difference.",
      environment: "Clear expectations, shared responsibilities and a predictable rhythm.",
      needs: "Teammates who share the load and give you a heads-up before big changes.",
      expect: "Reliability, calm in stressful moments and tasks that actually get finished.",
    },
    gifts: ["Steady follow-through", "A stable foundation", "Calm when things get messy"],
    sessionStyle: "set a steady pace and work through the list one item at a time",
    tension: "want to stick with the plan once it's set",
    partnerTip: "Give them a clear plan and a heads-up before changes, and they'll keep the whole session on track.",
    complements: ["spark", "explorer"],
    dimensions: { planning: 2, execution: 2, motivation: 1, creativity: 0, focus: 2, accountability: 3, harmony: 2 },
  },
  spark: {
    id: "spark",
    name: "The Spark",
    identity: "The energetic initiator who gets people moving.",
    tagline: "You're the person who turns \"we should\" into \"let's go\".",
    intro: "You bring energy that makes it easier for a group to get started. Where others hesitate, you're often already rallying people around an idea.",
    weights: { openness: 0.5, conscientiousness: -0.3, extraversion: 1, agreeableness: 0.2, neuroticism: -0.2 },
    strengths: [
      {
        name: "Getting things started",
        explanation: "You seem to enjoy kicking things off and taking the first step.",
        benefit: "Teams spend less time stuck waiting for someone to begin.",
        example: "At the first meeting, you may be the one who suggests a plan for the next hour.",
      },
      {
        name: "Contagious enthusiasm",
        explanation: "Your energy seems to rub off on the people around you.",
        benefit: "Motivation stays higher, especially early in a project.",
        example: "When the group is tired, you may be the one who reminds everyone how close they are.",
      },
      {
        name: "Rallying people",
        explanation: "You seem comfortable bringing people together around an idea.",
        benefit: "Teams find a shared direction faster.",
        example: "You set up the group chat and get everyone to agree on a meeting time.",
      },
    ],
    blindSpots: [
      {
        name: "Follow-through can fade",
        howItShows: "Once the exciting start is over, finishing the details may feel less appealing.",
        tryThis: "Pair up with someone who loves finishing, and agree on the end state before you start.",
      },
      {
        name: "Jumping ahead",
        howItShows: "In the excitement of starting, you may skip planning steps that would save time later.",
        tryThis: "Take five minutes to agree on the goal and first steps before diving in.",
      },
    ],
    role: {
      title: "The energiser",
      contribute: "You start momentum and lift the team's energy, especially at the beginning of a project or after a setback.",
      communicate: "You tend to communicate with enthusiasm and keep conversations lively.",
      motivation: "New challenges, people to work with and seeing ideas come to life.",
      environment: "Collaborative, fast-moving settings with room for ideas.",
      needs: "Teammates who help turn the energy into a plan and keep track of details.",
      expect: "A quick start, encouragement and an upbeat presence.",
    },
    gifts: ["Energy to get started", "Fresh enthusiasm", "A willingness to take the first step"],
    sessionStyle: "jump in quickly and keep the energy up",
    tension: "want to change direction while the current plan is still in progress",
    partnerTip: "Agree on the goal before the session. Give them room to brainstorm, then help turn the idea into a concrete next step.",
    complements: ["anchor", "builder"],
    dimensions: { planning: 0, execution: 1, motivation: 3, creativity: 2, focus: 0, accountability: 1, harmony: 2 },
  },
  strategist: {
    id: "strategist",
    name: "The Strategist",
    identity: "The thoughtful planner who sees the bigger picture.",
    tagline: "You're the person who turns a messy goal into a clear plan.",
    intro: "You seem to like seeing how the pieces fit together before diving in. When a goal feels vague, you're often the one who maps out the route.",
    weights: { openness: 0.6, conscientiousness: 0.9, extraversion: -0.3, agreeableness: 0, neuroticism: -0.2 },
    strengths: [
      {
        name: "Seeing the big picture",
        explanation: "You seem to think about where a project is heading, not just the next task.",
        benefit: "Teams avoid work that doesn't move them toward the goal.",
        example: "You may notice that two features overlap before anyone builds both.",
      },
      {
        name: "Turning ambiguity into a plan",
        explanation: "You seem comfortable organising open-ended problems into steps.",
        benefit: "Everyone knows what to do next.",
        example: "After a vague brief, you might sketch a timeline with milestones for the team.",
      },
      {
        name: "Thinking ahead",
        explanation: "You seem to anticipate what could go wrong.",
        benefit: "Problems get planned for instead of discovered late.",
        example: "You may build in a buffer week before the final presentation.",
      },
    ],
    blindSpots: [
      {
        name: "Planning can turn into overthinking",
        howItShows: "Because you want the plan to be right, you may keep refining it when it's already good enough to start.",
        tryThis: "Set a time limit for planning, then start and adjust as you learn.",
      },
      {
        name: "Holding on to the plan",
        howItShows: "When things change, sticking to the original plan may feel safer than adapting it.",
        tryThis: "Schedule quick check-ins where the plan is allowed to change.",
      },
    ],
    role: {
      title: "The planner",
      contribute: "You turn ambiguous goals into organised plans and help the team see how today's work connects to the final result.",
      communicate: "You tend to communicate in a structured way, often summarising options and next steps.",
      motivation: "Understanding the why, solving complex problems and seeing a plan come together.",
      environment: "Time to think, clear goals and room to organise the approach.",
      needs: "Teammates who turn plans into action and tell you when it's time to start.",
      expect: "A clear plan, thoughtful questions and an eye on the bigger picture.",
    },
    gifts: ["A clear plan", "Big-picture thinking", "Foresight about what could go wrong"],
    sessionStyle: "start by mapping the steps, then work through them in order",
    tension: "want to keep refining the plan before starting",
    partnerTip: "Ask them for a quick plan at the start, and agree together on when it's time to stop planning and start doing.",
    complements: ["builder", "spark"],
    dimensions: { planning: 3, execution: 1, motivation: 1, creativity: 2, focus: 2, accountability: 2, harmony: 1 },
  },
  explorer: {
    id: "explorer",
    name: "The Explorer",
    identity: "The curious experimenter who sees possibilities.",
    tagline: "You're the person who asks \"what if?\" when everyone else says \"that's how it's done\".",
    intro: "You seem to enjoy ideas, possibilities and trying things that haven't been tried. You bring fresh angles that help a team avoid the obvious answer.",
    weights: { openness: 1, conscientiousness: -0.4, extraversion: 0.3, agreeableness: 0, neuroticism: 0 },
    strengths: [
      {
        name: "Creative ideas",
        explanation: "You seem to come up with ideas others might not think of.",
        benefit: "Teams get more options to choose from.",
        example: "In a brainstorm, you may suggest the unusual idea that ends up being the best one.",
      },
      {
        name: "Adaptability",
        explanation: "You seem comfortable when plans change.",
        benefit: "The team adjusts quickly when something doesn't work.",
        example: "When a tool doesn't fit, you may already be trying an alternative.",
      },
      {
        name: "Curiosity",
        explanation: "You seem to enjoy learning how things work.",
        benefit: "The team learns new tools and approaches faster.",
        example: "You might teach the group a shortcut you found while experimenting.",
      },
    ],
    blindSpots: [
      {
        name: "Routine can feel draining",
        howItShows: "Repetitive or highly structured tasks may feel harder to stay with than for others.",
        tryThis: "Break routine tasks into short sprints and alternate them with more creative work.",
      },
      {
        name: "Ideas may outnumber finished work",
        howItShows: "Starting new experiments might feel more exciting than finishing current ones.",
        tryThis: "Pick one idea per session to take all the way to a small finished result.",
      },
    ],
    role: {
      title: "The idea generator",
      contribute: "You introduce new ideas and alternative approaches, helping the team avoid settling too early.",
      communicate: "You tend to communicate with questions and possibilities, often opening up the conversation.",
      motivation: "Novel problems, learning and freedom to experiment.",
      environment: "Open-ended work with room to try things and learn.",
      needs: "Teammates who help choose the best ideas and carry them to the finish.",
      expect: "Fresh perspectives, curiosity and flexibility when plans change.",
    },
    gifts: ["Fresh ideas", "Flexibility when plans change", "Curiosity about better ways"],
    sessionStyle: "try a few approaches before settling on one",
    tension: "want to explore one more idea before committing",
    partnerTip: "Leave a short slot for exploring ideas, then agree together which one to take forward.",
    complements: ["anchor", "strategist"],
    dimensions: { planning: 0, execution: 1, motivation: 2, creativity: 3, focus: 1, accountability: 0, harmony: 1 },
  },
  harmonizer: {
    id: "harmonizer",
    name: "The Harmonizer",
    identity: "The teammate who brings people together.",
    tagline: "You're the person who makes sure everyone feels part of the team.",
    intro: "You seem to notice how people are feeling and what they need. You help a group trust each other, which makes everything else easier.",
    weights: { openness: 0.1, conscientiousness: 0.1, extraversion: 0.4, agreeableness: 1, neuroticism: 0 },
    strengths: [
      {
        name: "Empathy",
        explanation: "You seem to understand how others feel.",
        benefit: "Teammates feel supported and heard.",
        example: "You notice a teammate seems frustrated and check in privately.",
      },
      {
        name: "Collaboration",
        explanation: "You seem to enjoy working with others rather than alone.",
        benefit: "Work gets shared and the team stays connected.",
        example: "You suggest pairing up on the hardest task instead of splitting it.",
      },
      {
        name: "Diplomacy",
        explanation: "You seem able to help people with different views find common ground.",
        benefit: "Disagreements get resolved without lasting tension.",
        example: "When two teammates disagree, you may help each explain their side.",
      },
    ],
    blindSpots: [
      {
        name: "Avoiding difficult conversations",
        howItShows: "Because harmony matters to you, you may hold back a concern to keep the peace.",
        tryThis: "Share concerns early and kindly; small honest notes prevent bigger conflicts later.",
      },
      {
        name: "Putting others first too often",
        howItShows: "You may take on others' tasks or worries at the expense of your own work.",
        tryThis: "Offer help after you've planned your own tasks for the session.",
      },
    ],
    role: {
      title: "The connector",
      contribute: "You build trust and keep the team cohesive, so people feel comfortable sharing ideas and asking for help.",
      communicate: "You tend to communicate warmly, often making sure everyone gets a say.",
      motivation: "A team that gets along and supports each other.",
      environment: "Friendly, respectful groups with open communication.",
      needs: "Teammates who are honest with you and share the emotional load.",
      expect: "Support, encouragement and help keeping the team together.",
    },
    gifts: ["Trust in the team", "Support when things get hard", "Help resolving disagreements"],
    sessionStyle: "check in with everyone and keep the mood positive",
    tension: "want to smooth over a disagreement instead of settling it",
    partnerTip: "Ask for their honest opinion directly; they may be holding back to keep the peace.",
    complements: ["challenger", "spark"],
    dimensions: { planning: 1, execution: 1, motivation: 2, creativity: 1, focus: 1, accountability: 1, harmony: 3 },
  },
  builder: {
    id: "builder",
    name: "The Builder",
    identity: "The practical teammate focused on getting things done.",
    tagline: "You're the person who turns ideas into something real.",
    intro: "You seem to prefer doing over talking about doing. When a plan is on the table, you're often the first to start building it.",
    weights: { openness: -0.2, conscientiousness: 0.7, extraversion: 0.5, agreeableness: 0, neuroticism: -0.4 },
    strengths: [
      {
        name: "Turning plans into results",
        explanation: "You seem to enjoy making visible progress.",
        benefit: "Ideas become finished work instead of staying on paper.",
        example: "While others debate, you may already have a first version to show.",
      },
      {
        name: "Focused execution",
        explanation: "You seem to keep your attention on the task at hand.",
        benefit: "The team moves forward steadily.",
        example: "You knock out three tasks from the board in one session.",
      },
      {
        name: "Productive momentum",
        explanation: "You seem to keep a good working pace.",
        benefit: "Deadlines feel more manageable for everyone.",
        example: "You set a target for the session and hit it.",
      },
    ],
    blindSpots: [
      {
        name: "Moving too fast",
        howItShows: "Because you like making progress, you may start building before the plan is clear.",
        tryThis: "Spend the first few minutes confirming the goal with someone who likes planning.",
      },
      {
        name: "Details can get skipped",
        howItShows: "In the rush to finish, small details or checks may get overlooked.",
        tryThis: "Add a quick review step before calling a task done.",
      },
    ],
    role: {
      title: "The doer",
      contribute: "You convert ideas into tangible progress and keep the work moving.",
      communicate: "You tend to communicate directly and practically, focused on what needs doing.",
      motivation: "Seeing real results and ticking things off.",
      environment: "Clear tasks, the tools you need and room to get on with it.",
      needs: "Teammates who help plan ahead and catch details you might move past.",
      expect: "Visible progress, practical solutions and a strong work rate.",
    },
    gifts: ["Practical progress", "A strong work rate", "Ideas turned into something real"],
    sessionStyle: "pick a task and start building right away",
    tension: "want to start doing before the plan is agreed",
    partnerTip: "Give them a clear task and a target; they'll turn it into progress you can see.",
    complements: ["strategist", "spark"],
    dimensions: { planning: 1, execution: 3, motivation: 2, creativity: 1, focus: 2, accountability: 2, harmony: 1 },
  },
  challenger: {
    id: "challenger",
    name: "The Challenger",
    identity: "The ambitious teammate who pushes standards higher.",
    tagline: "You're the person who asks \"is this our best work?\"",
    intro: "You seem to care about doing things well and aren't afraid to say when something could be better. You push a team past \"good enough\".",
    weights: { openness: 0.1, conscientiousness: 0.6, extraversion: 0.7, agreeableness: -0.6, neuroticism: -0.3 },
    strengths: [
      {
        name: "Raising the bar",
        explanation: "You seem to hold yourself and others to high standards.",
        benefit: "The team's work ends up stronger.",
        example: "You may suggest one more round of testing before submitting.",
      },
      {
        name: "Challenging assumptions",
        explanation: "You seem willing to question ideas, even popular ones.",
        benefit: "Weak spots get found early.",
        example: "You ask why the group chose an approach before everyone commits to it.",
      },
      {
        name: "Accountability",
        explanation: "You seem to expect commitments to be kept.",
        benefit: "The team follows through on what it promised.",
        example: "You check whether last week's action items were actually done.",
      },
    ],
    blindSpots: [
      {
        name: "Feedback can feel like criticism",
        howItShows: "Your push for quality may come across as harsher than you intend.",
        tryThis: "Pair each critique with something that's working well.",
      },
      {
        name: "Impatience",
        howItShows: "When others move slower than you'd like, frustration may show.",
        tryThis: "Ask what's slowing someone down before pushing harder.",
      },
    ],
    role: {
      title: "The standard-setter",
      contribute: "You push the team to improve and avoid complacency, and help keep commitments honest.",
      communicate: "You tend to communicate directly, saying what you think clearly.",
      motivation: "Ambitious goals, high-quality work and winning together.",
      environment: "Teams with clear goals, high standards and room for honest debate.",
      needs: "Teammates who can take honest feedback and help soften it when needed.",
      expect: "High standards, direct feedback and a drive to do better.",
    },
    gifts: ["High standards", "Honest feedback", "A push to do better"],
    sessionStyle: "set an ambitious target and keep the bar high",
    tension: "push for more when others feel it's already good enough",
    partnerTip: "Agree on what \"good enough\" looks like up front, and welcome their feedback as part of the process.",
    complements: ["harmonizer", "anchor"],
    dimensions: { planning: 2, execution: 2, motivation: 2, creativity: 1, focus: 1, accountability: 3, harmony: 0 },
  },
  flowkeeper: {
    id: "flowkeeper",
    name: "The Flowkeeper",
    identity: "The deep-focus teammate who protects concentration.",
    tagline: "You're the person who does their best work in the quiet.",
    intro: "You seem to do your best work when you can get into a groove without interruptions. Given the time, you produce careful, high-quality work.",
    weights: { openness: 0.3, conscientiousness: 0.6, extraversion: -1, agreeableness: 0, neuroticism: 0 },
    strengths: [
      {
        name: "Deep focus",
        explanation: "You seem able to concentrate for long stretches.",
        benefit: "Complex tasks get the attention they need.",
        example: "You may take on the trickiest part of the project and see it through.",
      },
      {
        name: "Thoughtful work",
        explanation: "You seem to think carefully before acting.",
        benefit: "Fewer mistakes and better-considered solutions.",
        example: "Your part of the project needs fewer fixes later.",
      },
      {
        name: "Independent productivity",
        explanation: "You seem comfortable working on your own.",
        benefit: "The team can split work and trust it'll get done.",
        example: "You take a task home and come back with it finished.",
      },
    ],
    blindSpots: [
      {
        name: "Going quiet",
        howItShows: "While focused, you may forget to update the team on your progress.",
        tryThis: "Post a short update at the start and end of each session.",
      },
      {
        name: "Interruptions can derail you",
        howItShows: "Sudden changes or meetings may feel more disruptive to you than to others.",
        tryThis: "Agree on quiet work blocks with your team, plus a set time to check in.",
      },
    ],
    role: {
      title: "The deep worker",
      contribute: "You create high-quality work through sustained concentration, often on the hardest parts.",
      communicate: "You tend to communicate thoughtfully and concisely, often in writing.",
      motivation: "Meaningful, challenging work and time to do it properly.",
      environment: "Quiet time, clear tasks and few interruptions.",
      needs: "Teammates who respect focus time and keep you in the loop.",
      expect: "Careful, high-quality work and thoughtful input.",
    },
    gifts: ["Deep focus", "Careful, high-quality work", "Quiet, independent progress"],
    sessionStyle: "settle into a long, quiet stretch of focused work",
    tension: "want uninterrupted time when others want to talk things through",
    partnerTip: "Agree on quiet blocks and a set check-in time, and give them the tasks that need deep focus.",
    complements: ["spark", "harmonizer"],
    dimensions: { planning: 1, execution: 2, motivation: 0, creativity: 2, focus: 3, accountability: 2, harmony: 1 },
  },
};

/** Display order, also used to break ties so results are deterministic. */
export const ARCHETYPE_ORDER: readonly ArchetypeId[] = [
  "anchor",
  "spark",
  "strategist",
  "explorer",
  "harmonizer",
  "builder",
  "challenger",
  "flowkeeper",
];
