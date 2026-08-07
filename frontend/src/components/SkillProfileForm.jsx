import { useState } from 'react';
import { api } from '../api.js';
import { Field, inputClass, Notice } from './Field.jsx';
import SkillTags from './SkillTags.jsx';

const EMPTY = {
  full_name: '', email: '', headline: '', bio: '', location: '',
  years_experience: 10, weekly_hours: 10, remote_ok: true
};

export default function SkillProfileForm({ onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [resume, setResume] = useState('');
  const [skills, setSkills] = useState([]);
  const [skillDraft, setSkillDraft] = useState('');
  const [status, setStatus] = useState({ tone: 'info', message: '' });
  const [busy, setBusy] = useState(false);

  const update = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const addSkill = () => {
    const name = skillDraft.trim().toLowerCase();
    if (!name || skills.some((s) => s.name === name)) return setSkillDraft('');
    setSkills([...skills, { name, proficiency: 3 }]);
    setSkillDraft('');
  };

  async function readCv() {
    if (resume.trim().length < 40) {
      return setStatus({ tone: 'error', message: 'Paste at least a few lines of your CV first.' });
    }
    setBusy(true);
    setStatus({ tone: 'info', message: 'Reading your CV.' });
    try {
      const parsed = await api.parseResume(resume);
      setForm((previous) => ({
        ...previous,
        headline: parsed.headline || previous.headline,
        location: parsed.location || previous.location,
        years_experience: parsed.years_experience || previous.years_experience,
        bio: parsed.summary || previous.bio
      }));
      setSkills(parsed.skills || []);
      setStatus({
        tone: 'success',
        message: `Found ${parsed.skills.length} skills. Edit anything that looks wrong before you save.`
      });
    } catch (error) {
      setStatus({ tone: 'error', message: error.message });
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!form.full_name.trim() || !form.email.trim()) {
      return setStatus({ tone: 'error', message: 'Name and email are both needed.' });
    }
    setBusy(true);
    try {
      const created = await api.createProfessional({
        ...form,
        years_experience: Number(form.years_experience),
        weekly_hours: Number(form.weekly_hours),
        resume_text: resume,
        skills
      });
      setStatus({ tone: 'success', message: 'Profile saved. Ranking open projects now.' });
      onCreated?.(created);
    } catch (error) {
      setStatus({ tone: 'error', message: error.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-line bg-white p-5">
        <h3 className="font-display text-lg font-semibold">Start from your CV</h3>
        <p className="mt-1 text-sm text-ink-soft">
          Paste it and the platform fills in the form below. Everything stays editable.
        </p>
        <textarea
          rows={6}
          value={resume}
          onChange={(event) => setResume(event.target.value)}
          placeholder="Paste your CV text here."
          className={`${inputClass} mt-3 font-mono text-xs`}
        />
        <button
          type="button"
          onClick={readCv}
          disabled={busy}
          className="mt-3 rounded-lg border border-ink px-4 py-2 text-sm font-medium text-ink transition hover:bg-ink hover:text-white disabled:opacity-50"
        >
          Read my CV
        </button>
      </section>

      <section className="grid gap-4 rounded-xl border border-line bg-white p-5 sm:grid-cols-2">
        <Field label="Full name"><input className={inputClass} value={form.full_name} onChange={update('full_name')} /></Field>
        <Field label="Email"><input className={inputClass} type="email" value={form.email} onChange={update('email')} /></Field>
        <div className="sm:col-span-2">
          <Field label="Headline" hint="One line on what you do now.">
            <input className={inputClass} value={form.headline} onChange={update('headline')} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="About you">
            <textarea rows={4} className={inputClass} value={form.bio} onChange={update('bio')} />
          </Field>
        </div>
        <Field label="Location"><input className={inputClass} value={form.location} onChange={update('location')} /></Field>
        <Field label="Years of experience">
          <input className={inputClass} type="number" min="0" max="60" value={form.years_experience} onChange={update('years_experience')} />
        </Field>
        <Field label="Hours a week you can give">
          <input className={inputClass} type="number" min="1" max="60" value={form.weekly_hours} onChange={update('weekly_hours')} />
        </Field>
        <label className="flex items-center gap-2 self-end pb-2.5 text-sm">
          <input type="checkbox" checked={form.remote_ok} onChange={update('remote_ok')} className="h-4 w-4 accent-[color:var(--color-teal)]" />
          Happy to work remotely
        </label>

        <div className="sm:col-span-2">
          <Field label="Skills" hint="Add the ones you would be happy to be judged on.">
            <div className="flex gap-2">
              <input
                className={inputClass}
                value={skillDraft}
                onChange={(event) => setSkillDraft(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addSkill(); } }}
                placeholder="grant writing"
              />
              <button type="button" onClick={addSkill} className="rounded-lg bg-ink px-4 text-sm font-medium text-white">Add</button>
            </div>
          </Field>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <SkillTags skills={skills} tone="matched" />
            {skills.length > 0 && (
              <button type="button" onClick={() => setSkills([])} className="font-mono text-[11px] text-ink-soft underline">
                clear
              </button>
            )}
          </div>
        </div>
      </section>

      <Notice tone={status.tone}>{status.message}</Notice>

      <button
        type="button"
        onClick={save}
        disabled={busy}
        className="w-full rounded-lg bg-teal px-5 py-3 font-medium text-white transition hover:bg-ink disabled:opacity-50 sm:w-auto"
      >
        Save profile and show my matches
      </button>
    </div>
  );
}
