# Deployment

Frontend to Vercel, backend to Railway. Deploy the backend first, because the frontend needs its
URL at build time.

## Backend On Railway

1. Push the repo to GitHub
2. In Railway, create a project from the repo and set the root directory to `backend`
3. Build command `npm install`, start command `npm start`
4. Add a volume mounted at `/data`, because SQLite needs a disk that survives a redeploy
5. Set the variables:

       PORT=4000
       DB_PATH=/data/skillmatch.db
       CLIENT_ORIGIN=https://your-app.vercel.app
       ANTHROPIC_API_KEY=sk-ant-...
       CLAUDE_MODEL=claude-sonnet-5
       VOYAGE_API_KEY=pa-...

6. Deploy, then run `npm run seed` once from the Railway shell to load the demo data
7. Check `https://your-api.up.railway.app/api/health`

Without a volume the database is wiped on every deploy, which is the single most common way
this setup embarrasses someone during a demo.

## Frontend On Vercel

1. Import the same repo and set the root directory to `frontend`
2. Framework preset Vite, build command `npm run build`, output directory `dist`
3. Add `VITE_API_URL=https://your-api.up.railway.app/api`
4. Deploy, then set `CLIENT_ORIGIN` on Railway to the URL Vercel gave you and redeploy the API

Vite inlines environment variables at build time, so changing `VITE_API_URL` needs a rebuild,
not just a restart.

## Model Names

`CLAUDE_MODEL` is read from the environment for a reason: model identifiers change. If a call
comes back with a model not found error, check the current identifiers in Anthropic's
documentation and update the variable. No code change needed.

## Moving To Postgres

The schema is standard SQL with one SQLite specific habit, `datetime('now')` defaults. Swap
those for `now()`, replace `better-sqlite3` with `pg`, and rewrite the prepared statements to
use `$1` placeholders. The services do not need to change. If you are moving for scale rather
than for hosting convenience, add `pgvector` and store embeddings in a `vector` column instead
of JSON text, then shortlist with an index before the exact scoring pass.

## Before A Demo

Run `npm run seed`, load the landing page, post one project, and pull one shortlist. Ninety
seconds, and it catches the two failures that actually happen: a wiped database and a stale
`VITE_API_URL`.
