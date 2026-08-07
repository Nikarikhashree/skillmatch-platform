# SkillMatch Platform

Full stack platform that matches experienced professionals to project based work at small
businesses and social enterprises and shows the reasoning behind every match.

React and Vite on the front, Express and SQLite on the back, Claude for written match
explanations, resume parsing and the support chatbot.

## Run It Locally

You need Node 20 or newer. Two terminals.

1. `cd backend && npm install`
2. `cp .env.example .env` (the defaults work with no API keys at all)
3. `npm run seed` to load eight professionals, eight projects and some impact data
4. `npm start`, which serves the API on `http://localhost:4000`
5. In the second terminal, `cd frontend && npm install`
6. `cp .env.example .env`
7. `npm run dev` and open `http://localhost:5173`

Check `http://localhost:4000/api/health` if anything looks wrong. It tells you which mode
each AI feature is running in.

## It Runs Without Any API Keys

Every AI feature has a deterministic fallback, so the demo never dies because a key expired
mid interview.

| Feature | With keys | Without keys |
| --- | --- | --- |
| Semantic similarity | Voyage AI embeddings | Local hashing vectoriser, 512 dimensions |
| Match explanations | Claude, two or three sentences | Sentence template built from the score breakdown |
| Resume parsing | Claude returns structured JSON | Dictionary and regex parse |
| Support chatbot | Claude with a live knowledge base | Intent rules over the same data |

Add `ANTHROPIC_API_KEY` to `backend/.env` to switch the writing features on, and
`VOYAGE_API_KEY` to switch the embeddings over. After changing embedding provider run
`npm run reindex` so the stored vectors match.

Anthropic does not sell an embeddings model, so the matching engine uses Voyage AI, which is
Anthropic's recommended embeddings partner. `docs/AI_MATCHING_ALGORITHM.md` explains why that
matters and how the two providers slot into the same interface.

## What Is In Here

    backend/          Express API, SQLite schema, matching engine, seed data
    frontend/         React pages, forms, match cards, impact dashboard
    docs/             Architecture, matching algorithm, deployment

## The Pages

Landing page, professional onboarding with CV parsing, organisation portal for posting a
project and pulling a shortlist, project browser with a per project fit check, and the impact
dashboard with a beneficiary intake form that stores reference codes rather than names.

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
| POST | `/api/analytics/beneficiaries` | Record an intake by reference code |
| POST | `/api/chatbot` | Ask the support assistant |

## Things Worth Knowing Before A Demo

The score is deliberately not a black box. Every card shows the three signals and their
weights, and the written reason names the biggest gap as well as the overlap. That is the part
worth talking about in an interview, more than the stack.

Beneficiary records hold a reference code, age band, programme and referral source. No names,
because a dashboard should not become a personal data liability.
