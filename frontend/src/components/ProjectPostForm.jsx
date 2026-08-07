import { useState } from 'react';
import { api } from '../api.js';
import { Field, inputClass, Notice } from './Field.jsx';
import SkillTags from './SkillTags.jsx';

const EMPTY = {
  company_name: '', sector: '', title: '', description: '',
  engagement_type: 'project', duration_weeks: 8, weekly_hours: 10,
  remote: true, location: '', min_experience: 5, budget_band: '', is_social_enterprise: false
};

export default function ProjectPostForm({ onPosted }) {
  const [form, setForm] = useState(EMPTY);
  const [skills, setSkills] = useState([]);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState({ tone: 'info', message: '' });
  const [busy, setBusy] = useState(false);

  const update = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const addSkill = (required = true) => {
    const name = draft.trim().toLowerCase();
    if (!name || skills.some((s) => s.name === name)) return setDraft('');
    setSkills([...skills, { name, weight: required ? 2 : 1, required }]);
    setDraft('');
  };

  async function post() {
    if (!form.title.trim() || !form.company_name.trim()) {
      return setStatus({ tone: 'error', message: 'Project title and organisation name are both needed.' });
    }
    setBusy(true);
    try {
      const created = await api.createOpportunity({
        ...form,
        duration_weeks: Number(form.duration_weeks),
        weekly_hours: Number(form.weekly_hours),
        min_experience: Number(form.min_experience),
        skills
      });
      setStatus({ tone: 'success', message: 'Project posted. Building your shortlist now.' });
      onPosted?.(created);
    } catch (error) {
      setStatus({ tone: 'error', message: error.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 rounded-xl border border-line bg-white p-5 sm:grid-cols-2">
        <Field label="Organisation"><input className={inputClass} value={form.company_name} onChange={update('company_name')} /></Field>
        <Field label="Sector"><input className={inputClass} value={form.sector} onChange={update('sector')} placeholder="Youth services" /></Field>

        <div className="sm:col-span-2">
          <Field label="Project title"><input className={inputClass} value={form.title} onChange={update('title')} /></Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="What needs doing" hint="Write it the way you would explain it to a colleague. The matching reads this text.">
            <textarea rows={5} className={inputClass} value={form.description} onChange={update('description')} />
          </Field>
        </div>

        <Field label="Shape of the work">
          <select className={inputClass} value={form.engagement_type} onChange={update('engagement_type')}>
            <option value="project">One off project</option>
            <option value="part-time">Ongoing part time</option>
            <option value="advisory">Advisory or mentoring</option>
          </select>
        </Field>
        <Field label="Budget band"><input className={inputClass} value={form.budget_band} onChange={update('budget_band')} placeholder="GBP 6k to 9k" /></Field>
        <Field label="Length in weeks">
          <input className={inputClass} type="number" min="1" max="104" value={form.duration_weeks} onChange={update('duration_weeks')} />
        </Field>
        <Field label="Hours a week">
          <input className={inputClass} type="number" min="1" max="60" value={form.weekly_hours} onChange={update('weekly_hours')} />
        </Field>
        <Field label="Minimum years of experience">
          <input className={inputClass} type="number" min="0" max="40" value={form.min_experience} onChange={update('min_experience')} />
        </Field>
        <Field label="Location"><input className={inputClass} value={form.location} onChange={update('location')} placeholder="Leeds, UK" /></Field>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.remote} onChange={update('remote')} className="h-4 w-4 accent-[color:var(--color-teal)]" />
          Can be done remotely
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_social_enterprise} onChange={update('is_social_enterprise')} className="h-4 w-4 accent-[color:var(--color-teal)]" />
          We are a charity or social enterprise
        </label>

        <div className="sm:col-span-2">
          <Field label="Skills needed" hint="Must haves carry twice the weight of nice to haves.">
            <div className="flex flex-wrap gap-2">
              <input
                className={`${inputClass} flex-1`}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addSkill(true); } }}
                placeholder="monitoring and evaluation"
              />
              <button type="button" onClick={() => addSkill(true)} className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white">Must have</button>
              <button type="button" onClick={() => addSkill(false)} className="rounded-lg border border-ink px-4 py-2 text-sm font-medium text-ink">Nice to have</button>
            </div>
          </Field>
          <div className="mt-3 flex flex-wrap gap-4">
            <div>
              <p className="label mb-1.5">Must have</p>
              <SkillTags skills={skills.filter((s) => s.required)} tone="matched" />
            </div>
            <div>
              <p className="label mb-1.5">Nice to have</p>
              <SkillTags skills={skills.filter((s) => !s.required)} tone="missing" />
            </div>
          </div>
        </div>
      </section>

      <Notice tone={status.tone}>{status.message}</Notice>

      <button
        type="button"
        onClick={post}
        disabled={busy}
        className="w-full rounded-lg bg-teal px-5 py-3 font-medium text-white transition hover:bg-ink disabled:opacity-50 sm:w-auto"
      >
        Post project and build shortlist
      </button>
    </div>
  );
}
