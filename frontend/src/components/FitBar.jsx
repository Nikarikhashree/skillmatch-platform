import { WEIGHTS } from '../scoring.js';

const SEGMENTS = [
  { key: 'semantic_score', label: 'Context', colour: 'var(--color-teal)', weight: WEIGHTS.semantic },
  { key: 'skill_score', label: 'Skills', colour: 'var(--color-amber)', weight: WEIGHTS.skills },
  { key: 'logistics_score', label: 'Practical', colour: 'var(--color-ink-soft)', weight: WEIGHTS.logistics }
];

/**
 * The signature element: one bar showing how much each signal contributed to
 * the score, so nobody has to take the number on trust.
 */
export default function FitBar({ match, showLegend = true }) {
  const contributions = SEGMENTS.map((segment) => ({
    ...segment,
    points: (Number(match[segment.key]) || 0) * segment.weight
  }));

  return (
    <div>
      <div
        className="flex h-2.5 w-full overflow-hidden rounded-full bg-mist"
        role="img"
        aria-label={`Fit score ${match.score} out of 100`}
      >
        {contributions.map((segment) => (
          <div
            key={segment.key}
            style={{ width: `${segment.points}%`, backgroundColor: segment.colour }}
            title={`${segment.label}: ${segment.points.toFixed(1)} points`}
          />
        ))}
      </div>

      {showLegend && (
        <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
          {contributions.map((segment) => (
            <div key={segment.key} className="flex items-baseline gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: segment.colour }} />
              <dt className="label">{segment.label}</dt>
              <dd className="font-mono text-xs text-ink">{segment.points.toFixed(1)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
