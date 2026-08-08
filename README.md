# SkillMatch Platform

Full stack platform that matches experienced professionals to short, project based work at small
businesses and social enterprises, and shows the reasoning behind every match.

Most matching tools hand you a ranked list and expect you to trust it. This one shows the three
signals behind each score, names the skills it could not find, and writes a short explanation that
says what the biggest gap is. The point is to be argued with.

**Live demo:** https://skillmatch-platform-kappa.vercel.app
**API health:** https://skillmatch-platform-production.up.railway.app/api/health

Built by Nikarikhashree, BSc Computer Science, University of London at SIM.

---

## What It Does

Professionals paste a CV and get a draft profile back, then see every open project ranked against
them. Organisations write a brief in plain words and get a shortlist of five people with the gaps
flagged, so the first phone call is about the right things.

Because many of the organisations posting are charities, there is also a volunteer signup flow,
donor and sponsor pages, and an impact dashboard that reports on cohorts without storing anyone's
name. A support chatbot answers from the live project list rather than from a canned FAQ.

Seven pages in total: landing, project browser, professional onboarding, organisation portal,
volunteer registration, donors and sponsors, and the impact dashboard.

---

## The Interesting Part: How Matching Works

The score is a fixed blend of three signals:

    score = 0.50 * context + 0.35 * skills + 0.15 * practical

**Context, 50 percent.** The profile text and the project text are turned into vectors and compared
with cosine similarity. This catches overlap that a keyword list misses, like measurement work
described as outcomes reporting.

**Skills, 35 percent.** Weighted coverage of what the brief asked for. Must haves count twice as
much as nice to haves, and each covered skill earns `weight * (0.6 + 0.4 * proficiency/5)`, so
holding a skill at all is most of the credit and depth is the rest.

**Practical, 15 percent.** Starts at one and loses points for an on site project the person is not
near, an hours shortfall, or falling under the stated experience floor. It is a penalty rather than
a filter on purpose, so a strong candidate with a fixable logistics problem still appears, just
lower.

### Why Three Signals Instead Of Just Cosine Similarity

Vectors alone are confidently wrong in ways that are hard to argue with. A fundraiser and a
fundraising brief score highly whether or not the person has ever written a trust bid. Explicit
skill coverage catches that. The practical layer catches the person who is perfect and unavailable.

Two real results from the seeded data show the design earning its complexity. An operations lead
scored 65.4 on a dashboard project, where the skills signal was low because Power BI is missing but
the context signal was high because her measurement background is genuinely relevant. The same
person scored 48.5 on a form redesign where skills was a flat zero but context was still 33.5,
because she understands how carers use forms under pressure even though she cannot do the design
work. A pure skills filter would have dropped her from both. A pure vector match would have ranked
her too high on both.

The written explanations regularly go further than the numbers. On a match where every requested
skill was covered and every practical box ticked, the model still flagged a capacity risk that none
of the three scores computed, because it read the ten week commitment against the stated weekly
availability. That is the part worth having a language model for.

Full detail, including the local vectoriser and the known weaknesses, is in
[`docs/AI_MATCHING_ALGORITHM.md`](docs/AI_MATCHING_ALGORITHM.md).

### On "Claude Embeddings"

Anthropic does not sell an embeddings model. Claude is a text generation model, so semantic matching
cannot be done with Claude alone. The work is split: Voyage AI, which is Anthropic's recommended
embeddings partner, produces the vectors, and Claude does the part it is actually good at, which is
reading a profile and a brief side by side and writing the reason someone is or is not a fit.

---

## Tech Stack

| Layer | Choice |
| --- | --- |
| Frontend | React 18, Vite, Tailwind CSS v4, React Router |
| Backend | Node.js, Express, better-sqlite3 |
| Database | SQLite, twelve tables, foreign keys on |
| Text generation | Claude Messages API |
| Embeddings | Voyage AI, with a local hashing vectoriser as fallback |
| Testing | Node's built in test runner |
| Hosting | Vercel for the frontend, Railway for the API, deploys on push |

---

## Running It Locally

You need Node 20 or newer. Two terminals.

**Backend**

1. `cd backend`
2. `npm install`
3. `cp .env.example .env` (Windows: `copy .env.example .env`)
4. `npm run seed` to load eight professionals, eight projects and some impact data
5. `npm start`, which serves the API on `http://localhost:4000`

**Frontend**

1. `cd frontend`
2. `npm install`
3. `cp .env.example .env`
4. `npm run dev`, then open `http://localhost:5173`

Visit `http://localhost:4000/api/health` if anything looks wrong. It reports which mode each AI
feature is running in.

---

## Tests

    cd backend
    npm test

Seven tests over the scoring functions and the local vectoriser, using Node's built in test runner
with no extra dependencies. They assert the behaviour the design claims: that full skill coverage
scores near the top, that missing skills are reported rather than silently dropped, that must haves
outweigh nice to haves, that an hours shortfall costs points without disqualifying, and that related
text scores higher than unrelated text.

The scoring functions are pure and take plain objects, which is what makes them testable without
going through HTTP or touching the database.

---

## It Runs Without Any API Keys

Every AI feature has a deterministic fallback, so the demo never dies because a key expired or a
balance ran out.

| Feature | With keys | Without keys |
| --- | --- | --- |
| Semantic similarity | Voyage AI embeddings | Local hashing vectoriser, 512 dimensions |
| Match explanations | Claude, two or three sentences | Template built from the score breakdown |
| CV parsing | Claude returns structured JSON | Dictionary and regex parse |
| Support chatbot | Claude with a live knowledge base | Intent rules over the same data |

Add `ANTHROPIC_API_KEY` to `backend/.env` to switch the writing features on, and `VOYAGE_API_KEY`
for the embeddings. After changing embedding provider, run `npm run reindex` so the stored vectors
are rebuilt in the new space, otherwise you are comparing vectors from two different spaces.

This is not decoration. During development a deprecated API parameter caused every Claude call to
fail, and the platform kept working on templates while logging the real error. The interface labels
which mode wrote each explanation, so the degradation is visible rather than silent.

---

## API

| Method | Path | Does |
| --- | --- | --- |
| GET | `/api/health` | Which AI mode each feature is in |
| GET | `/api/professionals` | Every profile with skills |
| POST | `/api/professionals` | Create a profile and index it |
| POST | `/api/professionals/parse-resume` | CV text or a `.txt` upload into a draft profile |
| GET | `/api/professionals/:id/matches` | Ranked open projects for one person |
| GET | `/api/companies/opportunities/all` | Open projects, with search and remote filters |
| POST | `/api/companies/opportunities` | Post a project and index it |
| GET | `/api/matches/opportunity/:id` | Ranked shortlist for one project |
| GET | `/api/matches/pair/:proId/:oppId` | Score one pair on demand |
| POST | `/api/matches/applications` | Apply to a project |
| GET | `/api/analytics` | Everything the impact dashboard renders |
| POST | `/api/analytics/volunteers` | Volunteer registration |
| POST | `/api/analytics/beneficiaries` | Record an intake by reference code |
| POST | `/api/analytics/enquiries` | Donor and sponsor enquiries |
| POST | `/api/chatbot` | Ask the support assistant |

---

## Project Structure

    backend/
      src/server.js          Express app, CORS, logging, error handler
      src/db/                Schema, connection, prepared queries, seed data
      src/routes/            Thin HTTP layer, validation only
      src/services/          Matching, embeddings, Claude wrapper, parsing, analytics
      src/scripts/           Reindex utility
    frontend/
      src/pages/             Seven pages
      src/components/        Fit bar, match cards, forms, chatbot, per route metadata
      public/                robots.txt and sitemap.xml
    docs/
      ARCHITECTURE.md        Data model, caching, failure behaviour
      AI_MATCHING_ALGORITHM.md
      DEPLOYMENT.md

Routes never hold logic. Anything with a decision in it lives in a service, which is what makes the
matching engine testable without going through HTTP.

---

## Decisions Worth Explaining

**Beneficiaries have no name column.** Intake records store a reference code, age band, programme
and referral source. That is a schema level decision rather than a form level one, so no future
endpoint can start storing names by accident. A dashboard should not quietly become a personal data
liability.

**Vectors are cached with the model that produced them.** Before scoring, the service checks whether
the stored vector came from the currently configured provider and regenerates it if not. Switching
from local to Voyage therefore never silently compares vectors from two different spaces.

**Embeddings never reach the browser.** They are stripped from every JSON response.

**Model identifiers live in the environment.** `CLAUDE_MODEL` is read from config because model
names change, so a rename is a variable edit rather than a code change.

**Client side routing is handled at the CDN.** `vercel.json` rewrites every path to `index.html`,
otherwise a refresh on any route other than the root returns a 404. Per route titles and
descriptions are set on navigation, since a single page app otherwise ships one static title for
every page.

---

## Roadmap

**Next.** Streaming explanations, so the ranked list renders immediately and the reasoning fills in
behind it. Authentication and rate limiting, which matter more the longer this stays publicly
reachable. An applications view so organisations can manage a shortlist rather than only generate
one.

**If it grew.** Learned weights, once there is outcome data to fit against. Postgres with pgvector
and an approximate nearest neighbour index to shortlist before the exact scoring pass, which is the
first real change needed past a few thousand profiles. Synonym handling on skill names, most likely
by embedding the names themselves rather than maintaining a lookup table by hand.

---

## Licence

MIT
