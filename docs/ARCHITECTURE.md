# Architecture

## Shape

    React + Vite (5173)  ->  Express API (4000)  ->  SQLite file
                                   |
                                   +-> Claude Messages API   (explanations, CV parsing, chatbot)
                                   +-> Voyage AI embeddings  (semantic similarity)

One API, one database file, no queue and no cache. At this size, extra moving parts would be
decoration.

## Backend Layout

    src/server.js              Express app, CORS, logging, error handler
    src/db/schema.sql          Eleven tables, foreign keys on
    src/db/index.js            Connection, prepared queries, skill helpers
    src/db/seed.js             Realistic demo data, then indexes every row
    src/routes/                Thin HTTP layer, validation only
    src/services/              All the logic worth testing
    src/scripts/reindex.js     Rebuild vectors after a provider change

Routes never talk to the database directly beyond simple reads. Anything with a decision in it
lives in a service, which is what makes the matching engine testable without HTTP.

## Data Model

Professionals and opportunities each hold their own text and a cached embedding. Skills are a
shared table with two join tables, so a skill name exists once and both sides can be queried
against it. That normalisation is what makes the demand and supply gap query on the dashboard
a single statement rather than a loop.

`matches` caches the last score for a pair, including the three component scores and the
written reason, so a shortlist can be redrawn without paying for the explanation twice.
`applications` tracks the funnel, and `impact_events`, `volunteers` and `beneficiaries` feed
the social enterprise dashboard.

Beneficiaries are stored by reference code with no name field. That is a schema level
decision, not a form level one, so no future endpoint can accidentally start storing names.

## Vector Caching

Embeddings are stored as JSON text alongside the row that produced them, with the model name
that produced them. Before scoring, the service checks whether the cached vector came from the
provider currently configured, and regenerates it if not. That means switching from local to
Voyage never silently compares vectors from two different spaces.

## Failure Behaviour

Every external call is wrapped so the platform degrades instead of breaking. A failed Voyage
call falls back to the local vectoriser for that request. A failed Claude call falls back to
the template explanation and logs a warning. The health endpoint reports which mode is live.

## What Would Change At Scale

SQLite and the linear scan over candidates are fine into the low thousands. Past that, the
first move is Postgres with pgvector and an approximate nearest neighbour index to shortlist
before the exact scoring pass, and a job queue for explanations so they are generated after
the ranked list is already on screen.
