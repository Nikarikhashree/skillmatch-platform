import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Field, Notice, inputClass } from '../components/Field.jsx';

function Bars({ rows, valueKey, labelKey, colour = 'var(--color-teal)' }) {
  const max = Math.max(1, ...rows.map((row) => Number(row[valueKey]) || 0));
  return (
    <ul className="space-y-2.5">
      {rows.map((row) => (
        <li key={row[labelKey]} className="grid grid-cols-[9rem_1fr_2.5rem] items-center gap-3">
          <span className="truncate text-sm text-ink-soft">{row[labelKey] || 'Unspecified'}</span>
          <span className="h-2 rounded-full bg-mist">
            <span
              className="block h-2 rounded-full"
              style={{ width: `${(Number(row[valueKey]) / max) * 100}%`, backgroundColor: colour }}
            />
          </span>
          <span className="text-right font-mono text-sm">{row[valueKey]}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [intake, setIntake] = useState({ reference_code: '', age_band: '18-24', programme: '', referral_source: '', support_needs: '' });
  const [intakeStatus, setIntakeStatus] = useState({ tone: 'info', message: '' });

  const load = () => api.analytics().then(setData).catch((problem) => setError(problem.message));
  useEffect(() => { load(); }, []);

  async function saveIntake() {
    if (!intake.reference_code.trim()) {
      return setIntakeStatus({ tone: 'error', message: 'A reference code is needed.' });
    }
    try {
      await api.addBeneficiary({ ...intake, consent_given: true });
      setIntakeStatus({ tone: 'success', message: 'Intake recorded against the programme.' });
      setIntake({ ...intake, reference_code: '', support_needs: '' });
      load();
    } catch (problem) {
      setIntakeStatus({ tone: 'error', message: problem.message });
    }
  }

  if (error) return <div className="mx-auto max-w-5xl px-5 py-12"><Notice tone="error">{error}</Notice></div>;
  if (!data) return <div className="mx-auto max-w-5xl px-5 py-12"><p className="label">Loading the numbers</p></div>;

  const headline = [
    ['Professionals', data.totals.professionals],
    ['Open projects', data.totals.open_opportunities],
    ['Matches generated', data.totals.matches_generated],
    ['Strong fits', data.totals.strong_matches],
    ['Placements', data.totals.placements],
    ['Hours contributed', data.totals.hours_contributed],
    ['Volunteers', data.totals.volunteers],
    ['People supported', data.totals.beneficiaries]
  ];

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <p className="label">Social enterprise view</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">Impact dashboard</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        The numbers a board or funder asks for, pulled straight from the matching data rather
        than assembled by hand each quarter.
      </p>

      <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
        {headline.map(([label, value]) => (
          <div key={label} className="bg-white p-4">
            <dd className="font-mono text-2xl">{value}</dd>
            <dt className="label mt-0.5">{label}</dt>
          </div>
        ))}
      </dl>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-line bg-white p-5">
          <h2 className="font-display text-lg font-semibold">Skills in demand</h2>
          <p className="mb-4 mt-1 text-sm text-ink-soft">Across every open project.</p>
          <Bars rows={data.topSkills} valueKey="demand" labelKey="name" />
        </section>

        <section className="rounded-xl border border-line bg-white p-5">
          <h2 className="font-display text-lg font-semibold">Where the pool is thin</h2>
          <p className="mb-4 mt-1 text-sm text-ink-soft">Demand minus the number of people who list it.</p>
          <Bars rows={data.skillGaps} valueKey="demand" labelKey="name" colour="var(--color-amber)" />
        </section>

        <section className="rounded-xl border border-line bg-white p-5">
          <h2 className="font-display text-lg font-semibold">Projects by sector</h2>
          <p className="mb-4 mt-1 text-sm text-ink-soft">Average match score across the board is {data.averageScore}.</p>
          <Bars rows={data.bySector} valueKey="opportunities" labelKey="sector" />
        </section>

        <section className="rounded-xl border border-line bg-white p-5">
          <h2 className="font-display text-lg font-semibold">People supported by programme</h2>
          <p className="mb-4 mt-1 text-sm text-ink-soft">Recorded by reference code, never by name.</p>
          {data.programmes.length
            ? <Bars rows={data.programmes} valueKey="beneficiaries" labelKey="programme" colour="var(--color-ink-soft)" />
            : <p className="text-sm text-ink-soft">No intakes recorded yet.</p>}
        </section>
      </div>

      <section className="mt-10 rounded-xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-semibold">Record an intake</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Only a reference code is stored, so the dashboard can report on cohorts without holding personal details.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Reference code">
            <input className={inputClass} value={intake.reference_code}
                   onChange={(event) => setIntake({ ...intake, reference_code: event.target.value })} placeholder="RB-2407" />
          </Field>
          <Field label="Age band">
            <select className={inputClass} value={intake.age_band}
                    onChange={(event) => setIntake({ ...intake, age_band: event.target.value })}>
              {['16-17', '18-24', '25-34', '35-44', '45-54', '55+'].map((band) => <option key={band}>{band}</option>)}
            </select>
          </Field>
          <Field label="Programme">
            <input className={inputClass} value={intake.programme}
                   onChange={(event) => setIntake({ ...intake, programme: event.target.value })} placeholder="Employability" />
          </Field>
          <Field label="Referral source">
            <input className={inputClass} value={intake.referral_source}
                   onChange={(event) => setIntake({ ...intake, referral_source: event.target.value })} placeholder="Partner charity" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Support needs">
              <input className={inputClass} value={intake.support_needs}
                     onChange={(event) => setIntake({ ...intake, support_needs: event.target.value })} />
            </Field>
          </div>
        </div>

        <div className="mt-4"><Notice tone={intakeStatus.tone}>{intakeStatus.message}</Notice></div>

        <button type="button" onClick={saveIntake}
                className="mt-4 rounded-lg bg-teal px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ink">
          Save intake
        </button>
      </section>
    </div>
  );
}
