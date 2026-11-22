import type { CSSProperties, ReactElement, ReactNode, Ref } from "react";
import { ARCHETYPES } from "@team-building-mvp/contracts";
import type {
  ArchetypeId,
  BlindSpot,
  Compatibility,
  IdealTeam,
  Insight,
  MatchStrength,
  Strength,
  TeamRole,
  TraitScore,
} from "@team-building-mvp/contracts";
import { PersonalityMascot } from "./PersonalityMascot";

/**
 * The pages of a personality profile. Each shows a few words up front and
 * keeps the rest behind a tap, so no page feels like a wall of text. They
 * take plain result data, so they can show anyone's profile.
 */

type HeadingRef = Ref<HTMLHeadingElement> | undefined;

const BAND_LABELS = { low: "Lower", middle: "Middle", high: "Higher" } as const;

/** Position in the page's entrance: items rise in one after another. */
function at(index: number): CSSProperties {
  return { "--i": index } as CSSProperties;
}

/** A page's heading. It takes focus when the page changes, for keyboard and screen reader users. */
function SlideHead({ kicker, title, lead, headingRef }: { kicker: string; title: string; lead?: string; headingRef: HeadingRef }): ReactElement {
  return (
    <header className="slide-head stagger" style={at(0)}>
      <p className="persona-kicker">{kicker}</p>
      <h2 ref={headingRef} tabIndex={-1}>
        {title}
      </h2>
      {lead ? <p className="slide-head__lead">{lead}</p> : null}
    </header>
  );
}

/** A card that shows its headline and opens for the details. */
function More({ summary, children, index }: { summary: ReactNode; children: ReactNode; index: number }): ReactElement {
  return (
    <details className="more-card stagger" style={at(index)}>
      <summary>
        <span className="more-card__summary">{summary}</span>
        <span className="more-card__toggle" aria-hidden="true" />
      </summary>
      <div className="more-card__body">{children}</div>
    </details>
  );
}

export function PersonalityReveal({
  primary,
  secondary,
  match,
  intro,
  headingRef,
}: {
  primary: ArchetypeId;
  secondary: ArchetypeId | null;
  match: { percent: number; strength: MatchStrength; label: string };
  intro: string;
  headingRef: HeadingRef;
}): ReactElement {
  const archetype = ARCHETYPES[primary];
  // Just the opening sentence here; the pages that follow explain the rest.
  const opening = /^.+?[.!?](?=\s|$)/.exec(intro)?.[0] ?? intro;
  return (
    <div className="persona-reveal">
      <div className="persona-reveal__mascot">
        <span className="persona-reveal__halo" aria-hidden="true" />
        <PersonalityMascot id={primary} />
      </div>
      <p className="persona-kicker">You're</p>
      <h1 className="persona-reveal__name" ref={headingRef} tabIndex={-1}>
        {archetype.name}
      </h1>
      <p className="persona-reveal__tagline">“{archetype.tagline}”</p>
      <div className="persona-reveal__meta">
        <span className={`match-pill match-pill--${match.strength}`}>
          {match.label} · {match.percent}% fit
        </span>
        {secondary ? (
          <span className="persona-reveal__secondary">
            {match.strength === "blended" ? "A blend with " : "With a touch of "}
            <strong>{ARCHETYPES[secondary].name}</strong>
          </span>
        ) : null}
      </div>
      <p className="persona-reveal__intro">{opening}</p>
    </div>
  );
}

export function WhyInsights({
  archetypeName,
  insights,
  headingRef,
}: {
  archetypeName: string;
  insights: Insight[];
  headingRef: HeadingRef;
}): ReactElement {
  return (
    <>
      <SlideHead kicker="Why" title={`What made you ${archetypeName}`} headingRef={headingRef} />
      <ol className="why-list">
        {insights.map((insight, index) => (
          <li key={insight.title} className="why-card stagger" style={at(index + 1)}>
            <span className="why-card__number" aria-hidden="true">
              {index + 1}
            </span>
            <div>
              <h3>{insight.title}</h3>
              <p>{insight.evidence}</p>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}

export function TraitBreakdown({ traits, total, headingRef }: { traits: TraitScore[]; total: number; headingRef: HeadingRef }): ReactElement {
  return (
    <>
      <SlideHead kicker="Your Big 5" title="Your five traits" lead="Tap one to see what it means for a team." headingRef={headingRef} />
      <div className="card-stack card-stack--tight">
        {traits.map((trait, index) => (
          <More
            key={trait.id}
            index={index + 1}
            summary={
              <span className="trait-row">
                <span className="trait-row__head">
                  <span className="trait-row__name">{trait.name}</span>
                  <span className={`trait-band trait-band--${trait.band}`}>{BAND_LABELS[trait.band]}</span>
                  <span className="trait-row__score">
                    {trait.display}
                    <span className="visually-hidden"> out of 100</span>
                  </span>
                </span>
                <span className="trait-bar" aria-hidden="true">
                  <span className="trait-bar__fill" style={{ ...at(index + 1), width: `${Math.max(4, trait.display)}%` }} />
                </span>
              </span>
            }
          >
            <p>{trait.teamText}</p>
          </More>
        ))}
      </div>
      <p className="slide-foot stagger" style={at(traits.length + 1)}>
        A rough guide from your {total} answers, rounded to the nearest 5. Not a diagnosis or a fixed label.
      </p>
    </>
  );
}

export function StrengthList({ strengths, headingRef }: { strengths: Strength[]; headingRef: HeadingRef }): ReactElement {
  return (
    <>
      <SlideHead kicker="Strengths" title="What you bring" lead="Tap one for an example." headingRef={headingRef} />
      <div className="card-stack">
        {strengths.map((strength, index) => (
          <More
            key={strength.name}
            index={index + 1}
            summary={
              <>
                <strong>{strength.name}</strong>
                <span>{strength.explanation}</span>
              </>
            }
          >
            <p>
              <span className="persona-label">Helps the team</span> {strength.benefit}
            </p>
            <p>
              <span className="persona-label">In a group</span> {strength.example}
            </p>
          </More>
        ))}
      </div>
    </>
  );
}

export function BlindSpotList({ blindSpots, headingRef }: { blindSpots: BlindSpot[]; headingRef: HeadingRef }): ReactElement {
  return (
    <>
      <SlideHead kicker="Watch for" title="Possible blind spots" lead="Things that might come up, not flaws. Tap one for a tip." headingRef={headingRef} />
      <div className="card-stack">
        {blindSpots.map((spot, index) => (
          <More
            key={spot.name}
            index={index + 1}
            summary={
              <>
                <strong>{spot.name}</strong>
                <span>{spot.howItShows}</span>
              </>
            }
          >
            <p>
              <span className="persona-label">Try this</span> {spot.tryThis}
            </p>
          </More>
        ))}
      </div>
    </>
  );
}

export function TeamRoleSection({ role, headingRef }: { role: TeamRole; headingRef: HeadingRef }): ReactElement {
  const rows: Array<[string, string]> = [
    ["How you communicate", role.communicate],
    ["What motivates you", role.motivation],
    ["Where you work best", role.environment],
    ["What you need from others", role.needs],
    ["What others can expect", role.expect],
  ];
  return (
    <>
      <SlideHead kicker="In a team" title={role.title} lead={role.contribute} headingRef={headingRef} />
      <div className="card-stack card-stack--tight">
        {rows.map(([term, detail], index) => (
          <More key={term} index={index + 1} summary={<strong>{term}</strong>}>
            <p>{detail}</p>
          </More>
        ))}
      </div>
    </>
  );
}

function CompatibilityCard({ match, index }: { match: Compatibility; index: number }): ReactElement {
  const other = ARCHETYPES[match.id];
  return (
    <article className="compat stagger" style={at(index)} aria-labelledby={`compat-${match.id}`}>
      <header className="compat__head">
        <div className="compat__mascot">
          <PersonalityMascot id={match.id} label={false} />
        </div>
        <div>
          <h3 id={`compat-${match.id}`}>{other.name}</h3>
          <p className="compat__identity">{other.identity}</p>
        </div>
      </header>
      <p className="compat__brings">They bring</p>
      <ul className="compat__chips">
        {match.theyBring.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <details className="compat__more">
        <summary>
          How you'd work together
          <span className="more-card__toggle" aria-hidden="true" />
        </summary>
        <div className="more-card__body">
          <p>{match.focusSession}</p>
          <p>
            <span className="persona-label">Watch for</span> {match.friction}
          </p>
          <p>
            <span className="persona-label">Tip</span> {match.tip}
          </p>
        </div>
      </details>
    </article>
  );
}

export function CompatibilitySection({ matches, headingRef }: { matches: Compatibility[]; headingRef: HeadingRef }): ReactElement {
  return (
    <>
      <SlideHead kicker="Good matches" title="Who you work well with" headingRef={headingRef} />
      <div className="compat-list">
        {matches.map((match, index) => (
          <CompatibilityCard key={match.id} match={match} index={index + 1} />
        ))}
      </div>
    </>
  );
}

export function IdealTeamSection({ team, headingRef }: { team: IdealTeam; headingRef: HeadingRef }): ReactElement {
  return (
    <>
      <SlideHead kicker="Ideal team" title="A balanced team around you" headingRef={headingRef} />
      <div className="balance stagger" style={at(1)}>
        <div className="balance__legend" aria-hidden="true">
          <span>
            <i className="balance__swatch balance__swatch--you" /> You
          </span>
          <span>
            <i className="balance__swatch balance__swatch--team" /> Your team
          </span>
        </div>
        <ul className="balance__list">
          {team.dimensions.map((dimension, row) => (
            <li key={dimension.id} className="balance__row">
              <span className="balance__label">{dimension.label}</span>
              <span
                className="balance__dots"
                role="img"
                aria-label={`${dimension.label}: you ${dimension.you} of 3, with the suggested team ${dimension.withTeam} of 3`}
              >
                {[0, 1, 2].map((step) => (
                  <i
                    key={step}
                    style={{ "--d": row * 3 + step } as CSSProperties}
                    className={`balance__dot${step < dimension.you ? " balance__dot--you" : step < dimension.withTeam ? " balance__dot--team" : ""}`}
                  />
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <ul className="ideal-list">
        {team.suggestions.map((suggestion, index) => (
          <li key={suggestion.id} className="ideal-item stagger" style={at(index + 2)}>
            <div className="ideal-item__mascot">
              <PersonalityMascot id={suggestion.id} label={false} />
            </div>
            <div>
              <h3>{ARCHETYPES[suggestion.id].name}</h3>
              <p>{suggestion.reason}</p>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
