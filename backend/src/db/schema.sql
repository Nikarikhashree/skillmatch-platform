PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS professionals (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name         TEXT    NOT NULL,
  email             TEXT    NOT NULL UNIQUE,
  headline          TEXT    NOT NULL DEFAULT '',
  bio               TEXT    NOT NULL DEFAULT '',
  location          TEXT    NOT NULL DEFAULT '',
  years_experience  INTEGER NOT NULL DEFAULT 0,
  weekly_hours      INTEGER NOT NULL DEFAULT 10,
  remote_ok         INTEGER NOT NULL DEFAULT 1,
  resume_text       TEXT    NOT NULL DEFAULT '',
  embedding         TEXT,
  embedding_model   TEXT,
  created_at        TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS companies (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  name                 TEXT    NOT NULL UNIQUE,
  sector               TEXT    NOT NULL DEFAULT '',
  contact_email        TEXT    NOT NULL DEFAULT '',
  location             TEXT    NOT NULL DEFAULT '',
  is_social_enterprise INTEGER NOT NULL DEFAULT 0,
  created_at           TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS opportunities (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id      INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title           TEXT    NOT NULL,
  description     TEXT    NOT NULL DEFAULT '',
  engagement_type TEXT    NOT NULL DEFAULT 'project',
  duration_weeks  INTEGER NOT NULL DEFAULT 8,
  weekly_hours    INTEGER NOT NULL DEFAULT 10,
  remote          INTEGER NOT NULL DEFAULT 1,
  location        TEXT    NOT NULL DEFAULT '',
  min_experience  INTEGER NOT NULL DEFAULT 0,
  budget_band     TEXT    NOT NULL DEFAULT '',
  status          TEXT    NOT NULL DEFAULT 'open',
  embedding       TEXT,
  embedding_model TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS skills (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE
);

CREATE TABLE IF NOT EXISTS professional_skills (
  professional_id INTEGER NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  skill_id        INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  proficiency     INTEGER NOT NULL DEFAULT 3,
  PRIMARY KEY (professional_id, skill_id)
);

CREATE TABLE IF NOT EXISTS opportunity_skills (
  opportunity_id INTEGER NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  skill_id       INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  weight         REAL    NOT NULL DEFAULT 1.0,
  required       INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (opportunity_id, skill_id)
);

CREATE TABLE IF NOT EXISTS matches (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  professional_id INTEGER NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  opportunity_id  INTEGER NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  score           REAL    NOT NULL,
  semantic_score  REAL    NOT NULL,
  skill_score     REAL    NOT NULL,
  logistics_score REAL    NOT NULL,
  explanation     TEXT    NOT NULL DEFAULT '',
  explained_by    TEXT    NOT NULL DEFAULT 'rules',
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (professional_id, opportunity_id)
);

CREATE TABLE IF NOT EXISTS applications (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  professional_id INTEGER NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  opportunity_id  INTEGER NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  status          TEXT    NOT NULL DEFAULT 'applied',
  hours_logged    INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (professional_id, opportunity_id)
);

CREATE TABLE IF NOT EXISTS volunteers (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name     TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE,
  skills_text   TEXT    NOT NULL DEFAULT '',
  hours_pledged INTEGER NOT NULL DEFAULT 0,
  programme     TEXT    NOT NULL DEFAULT '',
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS beneficiaries (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  reference_code  TEXT    NOT NULL UNIQUE,
  age_band        TEXT    NOT NULL DEFAULT '',
  programme       TEXT    NOT NULL DEFAULT '',
  referral_source TEXT    NOT NULL DEFAULT '',
  support_needs   TEXT    NOT NULL DEFAULT '',
  consent_given   INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS impact_events (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type     TEXT    NOT NULL,
  value          REAL    NOT NULL DEFAULT 1,
  programme      TEXT    NOT NULL DEFAULT '',
  occurred_on    TEXT    NOT NULL DEFAULT (date('now')),
  note           TEXT    NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_opps_status    ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_matches_score  ON matches(score DESC);
CREATE INDEX IF NOT EXISTS idx_impact_type    ON impact_events(event_type);
