import type { ReactElement } from "react";
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

/** Reusable pieces of a personality profile. Each takes plain result data, so they can show anyone's profile. */

const BAND_LABELS = { low: "Lower", middle: "Middle", high: "Higher" } as const;

export function PersonalityReveal({
  primary,
  secondary,
  match,
  intro,
}: {
  primary: ArchetypeId;
  secondary: ArchetypeId | null;
  match: { percent: number; strength: MatchStrength; label: string };
  intro: string;
}): ReactElement {
  const archetype = ARCHETYPES[primary];
  return (
    <div className="persona-reveal">
      <div className="persona-reveal__mascot">
        <PersonalityMascot id={primary} />
      </div>
      <p className="persona-kicker">Your personality</p>
      <h1 className="persona-reveal__name">{archetype.name}</h1>
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
      <p className="persona-reveal__intro">{intro}</p>
    </div>
  );
}

export function WhyInsights({ archetypeName, insights }: { archetypeName: string; insights: Insight[] }): ReactElement {
  return (
    <section className="persona-section" aria-labelledby="persona-why">
      <h2 id="persona-why">Why you got {archetypeName}</h2>
      <ol className="persona-insights">
        {insights.map((insight, index) => (
          <li key={insight.title} className="persona-insight">
            <span className="persona-insight__number" aria-hidden="true">
              {index + 1}
            </span>
            <div>
              <h3>{insight.title}</h3>
              <p>{insight.body}</p>
              <p className="persona-insight__evidence">{insight.evidence}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function TraitBreakdown({ traits }: { traits: TraitScore[] }): ReactElement {
  return (
    <section className="persona-section" aria-labelledby="persona-traits">
      <h2 id="persona-traits">Your Big 5 breakdown</h2>
      <p className="persona-section__lead">
        Each score comes from four of your answers and is rounded to the nearest 5. Treat them as a rough guide, not exact measurements.
      </p>
      <ul className="trait-list">
        {traits.map((trait) => (
          <li key={trait.id} className="trait-row">
            <div className="trait-row__head">
              <h3>{trait.name}</h3>
              <span className={`trait-band trait-band--${trait.band}`}>{BAND_LABELS[trait.band]}</span>
              <span className="trait-row__score">
                about <strong>{trait.display}</strong>
                <span className="visually-hidden"> out of 100</span>
              </span>
            </div>
            <div className="trait-bar" aria-hidden="true">
              <div className="trait-bar__fill" style={{ width: `${Math.max(4, trait.display)}%` }} />
            </div>
            <p>{trait.teamText}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function StrengthList({ strengths }: { strengths: Strength[] }): ReactElement {
  return (
    <section className="persona-section" aria-labelledby="persona-strengths">
      <h2 id="persona-strengths">Your strengths</h2>
      <div className="strength-grid">
        {strengths.map((strength) => (
          <article key={strength.name} className="strength-tile">
            <h3>{strength.name}</h3>
            <p>{strength.explanation}</p>
            <p>
              <span className="persona-label">Helps the team</span> {strength.benefit}
            </p>
            <p className="strength-tile__example">
              <span className="persona-label">In a group</span> {strength.example}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function BlindSpotList({ blindSpots }: { blindSpots: BlindSpot[] }): ReactElement {
  return (
    <section className="persona-section" aria-labelledby="persona-blindspots">
      <h2 id="persona-blindspots">Possible blind spots</h2>
      <p className="persona-section__lead">Things that might come up for you, not fixed flaws. Most people recognise one or two.</p>
      <ul className="blindspot-list">
        {blindSpots.map((spot) => (
          <li key={spot.name} className="blindspot">
            <h3>{spot.name}</h3>
            <p>{spot.howItShows}</p>
            <p className="blindspot__tip">
              <span className="persona-label">Try this</span> {spot.tryThis}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TeamRoleSection({ role }: { role: TeamRole }): ReactElement {
  const rows: Array<[string, string]> = [
    ["How you communicate", role.communicate],
    ["What motivates you", role.motivation],
    ["Where you do your best work", role.environment],
    ["What you may need from teammates", role.needs],
    ["What teammates can expect from you", role.expect],
  ];
  return (
    <section className="persona-section" aria-labelledby="persona-team">
      <h2 id="persona-team">How you work with a team</h2>
      <p className="team-role__title">{role.title}</p>
      <p className="team-role__lead">{role.contribute}</p>
      <dl className="team-role__grid">
        {rows.map(([term, detail]) => (
          <div key={term}>
            <dt>{term}</dt>
            <dd>{detail}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function CompatibilityCard({ match }: { match: Compatibility }): ReactElement {
  const other = ARCHETYPES[match.id];
  return (
    <article className="compat" aria-labelledby={`compat-${match.id}`}>
      <header className="compat__head">
        <div className="compat__mascot">
          <PersonalityMascot id={match.id} label={false} />
        </div>
        <div>
          <p className="persona-kicker">You work well with</p>
          <h3 id={`compat-${match.id}`}>{other.name}</h3>
          <p className="compat__identity">{other.identity}</p>
        </div>
      </header>
      <h4>Why you click</h4>
      <p>{match.whyClick}</p>
      <div className="compat__columns">
        <div>
          <h4>What they bring to you</h4>
          <ul>
            {match.theyBring.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4>What you bring to them</h4>
          <ul>
            {match.youBring.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
      <h4>In a focus session</h4>
      <p>{match.focusSession}</p>
      <h4>Potential friction</h4>
      <p>{match.friction}</p>
      <p className="compat__tip">
        <span className="persona-label">Your team tip</span> {match.tip}
      </p>
    </article>
  );
}

export function IdealTeamSection({ team }: { team: IdealTeam }): ReactElement {
  return (
    <section className="persona-section" aria-labelledby="persona-ideal">
      <h2 id="persona-ideal">Your ideal team</h2>
      <p className="persona-section__lead">
        One balanced mix around you, not a rule: every type adds something, and no team needs all eight.
      </p>
      <div className="balance">
        <div className="balance__legend" aria-hidden="true">
          <span>
            <i className="balance__swatch balance__swatch--you" /> You
          </span>
          <span>
            <i className="balance__swatch balance__swatch--team" /> Added by your team
          </span>
        </div>
        <ul className="balance__list">
          {team.dimensions.map((dimension) => (
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
                    className={`balance__dot${step < dimension.you ? " balance__dot--you" : step < dimension.withTeam ? " balance__dot--team" : ""}`}
                  />
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <ul className="ideal-list">
        {team.suggestions.map((suggestion) => (
          <li key={suggestion.id} className="ideal-item">
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
    </section>
  );
}
