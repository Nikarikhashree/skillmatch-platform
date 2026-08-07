import FitBar from './FitBar.jsx';
import SkillTags from './SkillTags.jsx';

function scoreTone(score) {
  if (score >= 70) return { label: 'Strong fit', className: 'bg-teal-soft text-teal' };
  if (score >= 50) return { label: 'Worth a call', className: 'bg-amber-soft text-amber' };
  return { label: 'Long shot', className: 'bg-mist text-ink-soft' };
}

/**
 * Shared results list. `variant` decides whether each row is a person
 * (shortlist for a project) or a project (matches for a person).
 */
export default function MatchingResults({ matches = [], variant = 'people', onApply, busyId }) {
  if (!matches.length) {
    return (
      <p className="rounded-lg border border-line bg-white p-6 text-sm text-ink-soft">
        No matches yet. Run the match once there is at least one profile and one open project.
      </p>
    );
  }

  return (
    <ol className="space-y-4">
      {matches.map((match, index) => {
        const tone = scoreTone(match.score);
        const isPerson = variant === 'people';
        const title = isPerson ? match.full_name : match.title;
        const subtitle = isPerson
          ? `${match.headline} · ${match.years_experience} years · ${match.location}`
          : `${match.company_name} · ${match.duration_weeks} weeks · ${match.weekly_hours}h a week · ${match.remote ? 'Remote' : match.location}`;

        return (
          <li key={isPerson ? match.professional_id : match.opportunity_id}
              className="rounded-xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(16,30,51,0.04)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <span className="label">Rank {String(index + 1).padStart(2, '0')}</span>
                <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
                <p className="mt-0.5 text-sm text-ink-soft">{subtitle}</p>
              </div>

              <div className="text-right">
                <div className="font-mono text-3xl font-medium text-ink">{match.score.toFixed(1)}</div>
                <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${tone.className}`}>
                  {tone.label}
                </span>
              </div>
            </div>

            <div className="mt-4"><FitBar match={match} /></div>

            <p className="mt-4 text-sm leading-relaxed text-ink">{match.explanation}</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="label mb-1.5">Covered</p>
                <SkillTags skills={match.matched_skills} tone="matched" />
                {!match.matched_skills?.length && <p className="text-xs text-ink-soft">Nothing on file yet</p>}
              </div>
              <div>
                <p className="label mb-1.5">Gaps to probe</p>
                <SkillTags skills={match.missing_skills} tone="missing" />
                {!match.missing_skills?.length && <p className="text-xs text-ink-soft">Full coverage</p>}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4 border-t border-line pt-3">
              <span className="label">
                Reason written by {match.explained_by === 'claude' ? 'Claude' : 'rules fallback'}
              </span>
              {onApply && (
                <button
                  type="button"
                  onClick={() => onApply(match)}
                  disabled={busyId === (isPerson ? match.professional_id : match.opportunity_id)}
                  className="rounded-lg bg-ink px-3.5 py-2 text-sm font-medium text-white transition hover:bg-teal disabled:opacity-50"
                >
                  {isPerson ? 'Shortlist' : 'Apply'}
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
