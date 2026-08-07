import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import SkillTags from '../components/SkillTags.jsx';
import FitBar from '../components/FitBar.jsx';
import { Notice, inputClass } from '../components/Field.jsx';

export default function OpportunityBrowser() {
  const [roles, setRoles] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [asWho, setAsWho] = useState('');
  const [search, setSearch] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [fits, setFits] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.listOpportunities(), api.listProfessionals()])
      .then(([openRoles, people]) => { setRoles(openRoles); setProfessionals(people); })
      .catch((problem) => setError(problem.message));
  }, []);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return roles
      .filter((role) => (remoteOnly ? role.remote : true))
      .filter((role) =>
        !term ||
        role.title.toLowerCase().includes(term) ||
        role.company_name.toLowerCase().includes(term) ||
        role.skills.some((skill) => skill.name.includes(term))
      );
  }, [roles, search, remoteOnly]);

  async function checkFit(role) {
    if (!asWho) return setError('Pick a profile first to see how you score against a project.');
    setBusyId(role.id);
    setError('');
    try {
      const result = await api.scorePair(Number(asWho), role.id);
      setFits((previous) => ({ ...previous, [role.id]: result }));
    } catch (problem) {
      setError(problem.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <p className="label">Open board</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">Browse projects</h1>

      <div className="mt-8 grid gap-3 rounded-xl border border-line bg-white p-4 sm:grid-cols-[1fr_1fr_auto]">
        <input
          className={inputClass}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search titles, organisations or skills"
        />
        <select className={inputClass} value={asWho} onChange={(event) => setAsWho(event.target.value)}>
          <option value="">View as a visitor</option>
          {professionals.map((person) => (
            <option key={person.id} value={person.id}>View as {person.full_name}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 px-1 text-sm">
          <input
            type="checkbox"
            checked={remoteOnly}
            onChange={(event) => setRemoteOnly(event.target.checked)}
            className="h-4 w-4 accent-[color:var(--color-teal)]"
          />
          Remote only
        </label>
      </div>

      <div className="mt-4"><Notice tone="error">{error}</Notice></div>

      <p className="label mt-6">{visible.length} open {visible.length === 1 ? 'project' : 'projects'}</p>

      <ul className="mt-3 space-y-4">
        {visible.map((role) => {
          const fit = fits[role.id];
          return (
            <li key={role.id} className="rounded-xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-semibold">{role.title}</h2>
                  <p className="mt-0.5 text-sm text-ink-soft">
                    {role.company_name} · {role.sector}
                    {role.is_social_enterprise ? ' · social enterprise' : ''}
                  </p>
                </div>
                <span className="rounded-full bg-mist px-3 py-1 font-mono text-[11px]">
                  {role.remote ? 'Remote' : role.location}
                </span>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-ink">{role.description}</p>

              <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
                {[
                  ['Length', `${role.duration_weeks} weeks`],
                  ['Commitment', `${role.weekly_hours}h a week`],
                  ['Experience', `${role.min_experience}+ years`],
                  ['Budget', role.budget_band || 'On discussion']
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="label">{label}</dt>
                    <dd className="font-mono text-sm">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-4"><SkillTags skills={role.skills} /></div>

              <div className="mt-4 border-t border-line pt-3">
                {fit ? (
                  <div>
                    <div className="flex items-baseline justify-between">
                      <span className="label">Your fit</span>
                      <span className="font-mono text-2xl">{fit.score.toFixed(1)}</span>
                    </div>
                    <div className="mt-2"><FitBar match={fit} /></div>
                    <p className="mt-3 text-sm leading-relaxed">{fit.explanation}</p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => checkFit(role)}
                    disabled={busyId === role.id}
                    className="rounded-lg border border-ink px-4 py-2 text-sm font-medium transition hover:bg-ink hover:text-white disabled:opacity-50"
                  >
                    {busyId === role.id ? 'Scoring' : 'How do I score against this?'}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
