import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Field, inputClass, Notice } from '../components/Field.jsx';
import SkillTags from '../components/SkillTags.jsx';

const PROGRAMMES = [
  {
    name: 'Digital skills',
    blurb: 'One to one sessions helping people get confident with online forms, banking and job applications.',
    asks: 'Patience more than technical depth. Two hours a week, in person or remote.'
  },
  {
    name: 'Employability',
    blurb: 'CV reviews, mock interviews and practical help getting a first application submitted.',
    asks: 'Anyone who has hired, interviewed, or been through a career change.'
  },
  {
    name: 'Money advice',
    blurb: 'Budgeting support and help making sense of letters people are afraid to open.',
    asks: 'Finance or admin background useful. Training provided before you meet anyone.'
  },
  {
    name: 'Mentoring',
    blurb: 'Longer term support for someone working towards a goal they set themselves.',
    asks: 'A six month commitment, roughly an hour a fortnight.'
  }
];

const EMPTY = { full_name: '', email: '', programme: '', hours_pledged: 4, skills_text: '' };

export default function VolunteerSignup() {
  const [form, setForm] = useState(EMPTY);
  const [skills, setSkills] = useState([]);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState({ tone: 'info', message: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [totals, setTotals] = useState(null);

  useEffect(() => {
    api.analytics().then((data) => setTotals(data.totals)).catch(() => setTotals(null));
  }, [done]);

  const update = (key) => (event) => setForm((previous) => ({ ...previous, [key]: event.target.value }));

  const addSkill = () => {
    const name = draft.trim().toLowerCase();
    if (!name || skills.includes(name)) return setDraft('');
    setSkills([...skills, name]);
    setDraft('');
  };

  async function submit() {
    if (!form.full_name.trim() || !form.email.trim()) {
      return setStatus({ tone: 'error', message: 'Name and email are both needed.' });
    }
    if (!form.programme) {
      return setStatus({ tone: 'error', message: 'Pick the programme you would like to help with.' });
    }

    setBusy(true);
    try {
      await api.addVolunteer({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        programme: form.programme,
        hours_pledged: Number(form.hours_pledged) || 0,
        skills_text: [form.skills_text, skills.join(', ')].filter(Boolean).join('. ')
      });
      setDone(true);
      setStatus({ tone: 'success', message: '' });
    } catch (error) {
      setStatus({ tone: 'error', message: error.message });
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <p className="label">Thank you</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">
          You are on the list, {form.full_name.split(' ')[0]}
        </h1>
        <p className="mt-4 text-ink-soft">
          The {form.programme.toLowerCase()} coordinator will email {form.email} within a week with the next
          induction date. Nothing is expected of you before then.
        </p>
        {totals && (
          <p className="mt-8 font-mono text-sm text-teal">
            {totals.volunteers} volunteers signed up, {totals.volunteer_hours_pledged} hours pledged
          </p>
        )}
        <button
          type="button"
          onClick={() => { setDone(false); setForm(EMPTY); setSkills([]); }}
          className="mt-8 text-sm text-ink-soft underline"
        >
          Sign someone else up
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <p className="label">Volunteer</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">Give a couple of hours</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Volunteers run most of what happens on the ground. You do not need a professional background for any of
        it, and nobody meets a beneficiary before an induction and a training session.
      </p>

      <section className="mt-10">
        <h2 className="label mb-3">Where the help is needed</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {PROGRAMMES.map((programme) => {
            const chosen = form.programme === programme.name;
            return (
              <button
                key={programme.name}
                type="button"
                onClick={() => setForm({ ...form, programme: programme.name })}
                aria-pressed={chosen}
                className={`rounded-xl border p-4 text-left transition ${
                  chosen ? 'border-teal bg-teal-soft' : 'border-line bg-white hover:border-ink'
                }`}
              >
                <h3 className="font-display text-lg font-semibold">{programme.name}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{programme.blurb}</p>
                <p className="mt-2 font-mono text-[11px] text-ink-soft">{programme.asks}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-8 grid gap-4 rounded-xl border border-line bg-white p-5 sm:grid-cols-2">
        <Field label="Full name">
          <input className={inputClass} value={form.full_name} onChange={update('full_name')} />
        </Field>
        <Field label="Email">
          <input className={inputClass} type="email" value={form.email} onChange={update('email')} />
        </Field>

        <Field label="Hours a month" hint="An honest number is more useful than a generous one.">
          <input
            className={inputClass}
            type="number"
            min="1"
            max="80"
            value={form.hours_pledged}
            onChange={update('hours_pledged')}
          />
        </Field>
        <Field label="Programme">
          <select className={inputClass} value={form.programme} onChange={update('programme')}>
            <option value="">Choose one</option>
            {PROGRAMMES.map((programme) => <option key={programme.name}>{programme.name}</option>)}
          </select>
        </Field>

        <div className="sm:col-span-2">
          <Field label="Anything you are good at" hint="Optional. It helps the coordinator place you well.">
            <div className="flex gap-2">
              <input
                className={inputClass}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addSkill(); } }}
                placeholder="spreadsheets"
              />
              <button type="button" onClick={addSkill} className="rounded-lg bg-ink px-4 text-sm font-medium text-white">
                Add
              </button>
            </div>
          </Field>
          <div className="mt-3"><SkillTags skills={skills} tone="matched" /></div>
        </div>

        <div className="sm:col-span-2">
          <Field label="Anything we should know" hint="Access needs, availability, questions.">
            <textarea rows={3} className={inputClass} value={form.skills_text} onChange={update('skills_text')} />
          </Field>
        </div>
      </section>

      <div className="mt-5"><Notice tone={status.tone}>{status.message}</Notice></div>

      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className="mt-5 w-full rounded-lg bg-teal px-5 py-3 font-medium text-white transition hover:bg-ink disabled:opacity-50 sm:w-auto"
      >
        {busy ? 'Sending' : 'Sign me up'}
      </button>

      <p className="mt-6 text-xs leading-relaxed text-ink-soft">
        We store your name, email, chosen programme and pledged hours so a coordinator can contact you. Nothing
        else, and nothing is shared outside the organisation. Ask us to delete it at any time.
      </p>
    </div>
  );
}