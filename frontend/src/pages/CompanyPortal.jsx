import { useEffect, useState } from 'react';
import { api } from '../api.js';
import ProjectPostForm from '../components/ProjectPostForm.jsx';
import MatchingResults from '../components/MatchingResults.jsx';
import { Notice } from '../components/Field.jsx';

export default function CompanyPortal() {
  const [openRoles, setOpenRoles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listOpportunities().then(setOpenRoles).catch((problem) => setError(problem.message));
  }, []);

  async function shortlist(opportunity) {
    setSelected(opportunity);
    setLoading(true);
    setError('');
    try {
      const result = await api.matchesForOpportunity(opportunity.id, 5);
      setMatches(result.matches);
    } catch (problem) {
      setError(problem.message);
    } finally {
      setLoading(false);
    }
  }

  async function onPosted(created) {
    setOpenRoles((previous) => [created, ...previous]);
    await shortlist(created);
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <p className="label">Organisation portal</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">Post a project, see who fits</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Write the brief in plain words. The matching reads the description as well as the skill
        list, so detail helps more than keyword stuffing.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div>
          <ProjectPostForm onPosted={onPosted} />

          {selected && (
            <section className="mt-12">
              <h2 className="font-display text-2xl font-bold">Shortlist for {selected.title}</h2>
              <p className="mt-1 text-sm text-ink-soft">Five best fits from {openRoles.length ? 'the current talent pool' : 'the pool'}.</p>
              {loading && <p className="label mt-4">Scoring the pool</p>}
              <Notice tone="error">{error}</Notice>
              <div className="mt-5"><MatchingResults matches={matches} variant="people" /></div>
            </section>
          )}
        </div>

        <aside className="h-fit rounded-xl border border-line bg-white p-5">
          <h2 className="font-display text-lg font-semibold">Already on the board</h2>
          <p className="mt-1 text-sm text-ink-soft">Pick one to rebuild its shortlist.</p>
          <ul className="mt-4 space-y-2">
            {openRoles.slice(0, 10).map((role) => (
              <li key={role.id}>
                <button
                  type="button"
                  onClick={() => shortlist(role)}
                  className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                    selected?.id === role.id ? 'border-teal bg-teal-soft' : 'border-line hover:border-ink'
                  }`}
                >
                  <span className="block font-medium">{role.title}</span>
                  <span className="text-xs text-ink-soft">{role.company_name}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
