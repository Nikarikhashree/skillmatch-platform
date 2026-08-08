import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Field, inputClass, Notice } from '../components/Field.jsx';

const TIERS = [
  {
    name: 'Friend',
    amount: 'From £10 a month',
    covers: 'Materials and travel costs for one person on a programme.',
    detail: 'Regular giving is what lets a coordinator plan a term ahead instead of a fortnight.'
  },
  {
    name: 'Partner',
    amount: '£1,000 to £5,000',
    covers: 'One full programme cohort, roughly twelve people from intake to outcome.',
    detail: 'Includes a written impact report drawn from the same dashboard the board sees.'
  },
  {
    name: 'Sponsor',
    amount: '£5,000 and above',
    covers: 'A named programme for a year, including volunteer training and evaluation.',
    detail: 'Named recognition, quarterly reporting, and an option to run employee volunteering alongside it.'
  }
];

const WHERE_IT_GOES = [
  ['76p', 'Programme delivery, including volunteer training and materials'],
  ['15p', 'Coordination staff, the people who make sessions actually happen'],
  ['9p', 'Running costs, including this platform']
];

const EMPTY = { contact_name: '', organisation: '', email: '', enquiry_type: 'donation', tier: '', message: '' };

export default function SupportUs() {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState({ tone: 'info', message: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [totals, setTotals] = useState(null);

  useEffect(() => {
    api.analytics().then((data) => setTotals(data.totals)).catch(() => setTotals(null));
  }, []);

  const update = (key) => (event) => setForm((previous) => ({ ...previous, [key]: event.target.value }));

  async function submit() {
    if (!form.contact_name.trim() || !form.email.trim()) {
      return setStatus({ tone: 'error', message: 'Name and email are both needed.' });
    }
    setBusy(true);
    try {
      await api.addEnquiry(form);
      setDone(true);
    } catch (error) {
      setStatus({ tone: 'error', message: error.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <p className="label">Donors and sponsors</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">
        Fund the hours, not the overheads
      </h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Every programme here runs on volunteer time and a small amount of money in the right places. Funding
        pays for the coordination that turns willing volunteers into sessions that actually happen.
      </p>

      {totals && (
        <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
          {[
            ['People supported', totals.beneficiaries],
            ['Volunteers', totals.volunteers],
            ['Hours contributed', totals.hours_contributed],
            ['Placements made', totals.placements]
          ].map(([label, value]) => (
            <div key={label} className="bg-white p-4">
              <dd className="font-mono text-2xl">{value}</dd>
              <dt className="label mt-0.5">{label}</dt>
            </div>
          ))}
        </dl>
      )}

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold">Ways to give</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {TIERS.map((tier) => (
            <article key={tier.name} className="flex flex-col rounded-xl border border-line bg-white p-5">
              <span className="label">{tier.name}</span>
              <p className="mt-1 font-display text-xl font-semibold">{tier.amount}</p>
              <p className="mt-3 text-sm leading-relaxed">{tier.covers}</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{tier.detail}</p>
              <button
                type="button"
                onClick={() => {
                  setForm({ ...form, tier: tier.name, enquiry_type: tier.name === 'Friend' ? 'donation' : 'sponsorship' });
                  document.getElementById('enquiry')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="mt-5 rounded-lg border border-ink px-4 py-2 text-sm font-medium transition hover:bg-ink hover:text-white"
              >
                Talk to us about {tier.name}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-xl border border-line bg-white p-6">
        <h2 className="font-display text-2xl font-bold">Where a pound goes</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Taken from the last published annual accounts, not from an aspiration.
        </p>
        <ul className="mt-5 space-y-4">
          {WHERE_IT_GOES.map(([share, purpose]) => (
            <li key={share} className="grid grid-cols-[3rem_1fr] items-baseline gap-4">
              <span className="font-mono text-xl text-teal">{share}</span>
              <span className="text-sm leading-relaxed">{purpose}</span>
            </li>
          ))}
        </ul>
      </section>

      <section id="enquiry" className="mt-12 scroll-mt-20">
        <h2 className="font-display text-2xl font-bold">Start a conversation</h2>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">
          No payment is taken here. Send this and a fundraiser replies with the practical detail, including
          Gift Aid for individual donors and reporting arrangements for organisations.
        </p>

        {done ? (
          <div className="mt-5 rounded-xl border border-teal bg-teal-soft p-6">
            <p className="font-display text-lg font-semibold text-teal">Thank you, we will be in touch</p>
            <p className="mt-2 text-sm text-teal">
              A fundraiser will reply to {form.email} within three working days.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-5 grid gap-4 rounded-xl border border-line bg-white p-5 sm:grid-cols-2">
              <Field label="Your name">
                <input className={inputClass} value={form.contact_name} onChange={update('contact_name')} />
              </Field>
              <Field label="Email">
                <input className={inputClass} type="email" value={form.email} onChange={update('email')} />
              </Field>
              <Field label="Organisation" hint="Leave blank if you are giving as an individual.">
                <input className={inputClass} value={form.organisation} onChange={update('organisation')} />
              </Field>
              <Field label="I am interested in">
                <select className={inputClass} value={form.enquiry_type} onChange={update('enquiry_type')}>
                  <option value="donation">Making a donation</option>
                  <option value="sponsorship">Sponsoring a programme</option>
                  <option value="corporate">Corporate partnership</option>
                  <option value="employee-volunteering">Employee volunteering</option>
                  <option value="other">Something else</option>
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Message" hint="Optional. A sentence on what you are hoping to support is plenty.">
                  <textarea rows={4} className={inputClass} value={form.message} onChange={update('message')} />
                </Field>
              </div>
            </div>

            <div className="mt-4"><Notice tone={status.tone}>{status.message}</Notice></div>

            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="mt-4 w-full rounded-lg bg-teal px-5 py-3 font-medium text-white transition hover:bg-ink disabled:opacity-50 sm:w-auto"
            >
              {busy ? 'Sending' : 'Send enquiry'}
            </button>
          </>
        )}
      </section>
    </div>
  );
}