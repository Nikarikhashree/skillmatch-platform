import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import FitBar from '../components/FitBar.jsx';

const SAMPLE = {
  score: 86, semantic_score: 73.5, skill_score: 98, logistics_score: 100,
  explanation: 'Fifteen years of measurement work, and the last six were spent doing exactly this for charities. The gap is Power BI specifically, so ask which tool she has actually shipped a board dashboard in.'
};

export default function LandingPage() {
  const [totals, setTotals] = useState(null);

  useEffect(() => {
    api.analytics().then((data) => setTotals(data.totals)).catch(() => setTotals(null));
  }, []);

  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-24">
        <div>
          <p className="label">For people with more experience than free time</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            The shortlist comes with its reasons attached.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
            SkillMatch puts experienced professionals on short, well scoped projects at small
            businesses and social enterprises. Every match shows the three things it was scored
            on, so you can disagree with it properly.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/join" className="rounded-lg bg-ink px-5 py-3 font-medium text-white transition hover:bg-teal">
              Build my profile
            </Link>
            <Link to="/post" className="rounded-lg border border-ink px-5 py-3 font-medium text-ink transition hover:bg-ink hover:text-white">
              Post a project
            </Link>
          </div>

          {totals && (
            <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4 border-t border-line pt-6">
              {[
                ['Professionals', totals.professionals],
                ['Open projects', totals.open_opportunities],
                ['Organisations', totals.companies],
                ['Hours contributed', totals.hours_contributed]
              ].map(([label, value]) => (
                <div key={label}>
                  <dd className="font-mono text-2xl text-ink">{value}</dd>
                  <dt className="label">{label}</dt>
                </div>
              ))}
            </dl>
          )}
        </div>

        {/* The hero is the product: one real match card, scored and explained. */}
        <div className="self-center rounded-2xl border border-line bg-white p-6 shadow-[0_20px_45px_-30px_rgba(16,30,51,0.45)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="label">Rank 01</span>
              <h2 className="font-display text-xl font-semibold">Amara Okonkwo</h2>
              <p className="text-sm text-ink-soft">Impact measurement lead · 15 years · Manchester</p>
            </div>
            <div className="text-right">
              <div className="font-mono text-4xl">86.0</div>
              <span className="label">out of 100</span>
            </div>
          </div>

          <div className="mt-5"><FitBar match={SAMPLE} /></div>
          <p className="mt-5 text-sm leading-relaxed">{SAMPLE.explanation}</p>
          <p className="mt-5 border-t border-line pt-3 text-xs text-ink-soft">
            Matched against: build an impact dashboard for the trustee board, Riverbank Youth Trust.
          </p>
        </div>
      </section>

      <section className="border-y border-line bg-white py-16">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="font-display text-3xl font-bold">What the score is made of</h2>
          <p className="mt-2 max-w-2xl text-ink-soft">
            Three signals, fixed weights, no black box. The same numbers appear on every card in the product.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              ['Context', '50%', 'The profile text and the project text are turned into vectors and compared. This catches the overlap that a keyword list misses, like measurement work described as outcomes reporting.'],
              ['Skills', '35%', 'Weighted coverage of the skills asked for, with must haves worth twice a nice to have, and proficiency taken into account.'],
              ['Practical', '15%', 'Hours available against hours needed, remote against on site, and years of experience against the floor set by the organisation.']
            ].map(([title, weight, body]) => (
              <article key={title} className="rounded-xl border border-line p-5">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-lg font-semibold">{title}</h3>
                  <span className="font-mono text-sm text-teal">{weight}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl bg-ink p-8 text-white">
            <p className="label !text-white/60">If you are the one with the skills</p>
            <h2 className="mt-2 font-display text-2xl font-bold">Paste a CV, get a ranked board</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/80">
              The platform reads your CV into a draft profile, you correct it, and open projects
              are ranked against you straight away. No fee, and no recruiter in the middle.
            </p>
            <Link to="/join" className="mt-6 inline-block rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-ink">
              Build my profile
            </Link>
          </article>

          <article className="rounded-2xl border border-line bg-white p-8">
            <p className="label">If you have work that needs doing</p>
            <h2 className="mt-2 font-display text-2xl font-bold">Describe it once, see five names</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Write the brief the way you would say it out loud. You get a shortlist with the gaps
              flagged, so the first call is about the right things. Charities and social enterprises
              also get the impact dashboard.
            </p>
            <Link to="/post" className="mt-6 inline-block rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white">
              Post a project
            </Link>
          </article>
        </div>
      </section>
    </>
  );
}
