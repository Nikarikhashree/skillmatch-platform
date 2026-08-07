import { useState } from 'react';
import { api } from '../api.js';
import SkillProfileForm from '../components/SkillProfileForm.jsx';
import MatchingResults from '../components/MatchingResults.jsx';
import { Notice } from '../components/Field.jsx';

export default function ProfessionalOnboarding() {
  const [profile, setProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [applied, setApplied] = useState([]);

  async function loadMatches(created) {
    setProfile(created);
    setLoading(true);
    setError('');
    try {
      const result = await api.matchesForProfessional(created.id, 5);
      setMatches(result.matches);
    } catch (problem) {
      setError(problem.message);
    } finally {
      setLoading(false);
    }
  }

  async function apply(match) {
    try {
      await api.apply(profile.id, match.opportunity_id);
      setApplied((previous) => [...previous, match.opportunity_id]);
    } catch (problem) {
      setError(problem.message);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <p className="label">Step {profile ? '2 of 2' : '1 of 2'}</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">
        {profile ? `Projects ranked for ${profile.full_name}` : 'Build your profile'}
      </h1>
      <p className="mt-3 text-ink-soft">
        {profile
          ? 'Ranked against every open project. Each score shows what it was built from.'
          : 'Ten minutes now, and the board ranks itself against you from then on.'}
      </p>

      <div className="mt-8">
        {!profile && <SkillProfileForm onCreated={loadMatches} />}

        {profile && (
          <>
            {loading && <p className="label">Scoring open projects</p>}
            <Notice tone="error">{error}</Notice>
            <MatchingResults
              matches={matches}
              variant="projects"
              onApply={apply}
              busyId={null}
            />
            {applied.length > 0 && (
              <p className="mt-5 rounded-lg bg-teal-soft px-4 py-3 text-sm text-teal">
                Applied to {applied.length} {applied.length === 1 ? 'project' : 'projects'}. The organisation sees your profile and the fit breakdown.
              </p>
            )}
            <button
              type="button"
              onClick={() => { setProfile(null); setMatches([]); setApplied([]); }}
              className="mt-8 text-sm text-ink-soft underline"
            >
              Start another profile
            </button>
          </>
        )}
      </div>
    </div>
  );
}
