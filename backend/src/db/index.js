import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import 'dotenv/config';

const here = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(process.env.DB_PATH || './data/skillmatch.db');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(fs.readFileSync(path.join(here, 'schema.sql'), 'utf8'));

/** Insert a skill if it is new and return its id. */
export function upsertSkill(name) {
  const clean = String(name || '').trim();
  if (!clean) return null;
  db.prepare('INSERT OR IGNORE INTO skills (name) VALUES (?)').run(clean);
  return db.prepare('SELECT id FROM skills WHERE name = ?').get(clean).id;
}

/** Replace the whole skill set of a professional in one transaction. */
export const setProfessionalSkills = db.transaction((professionalId, skills) => {
  db.prepare('DELETE FROM professional_skills WHERE professional_id = ?').run(professionalId);
  const link = db.prepare(
    'INSERT OR REPLACE INTO professional_skills (professional_id, skill_id, proficiency) VALUES (?, ?, ?)'
  );
  for (const entry of skills) {
    const name = typeof entry === 'string' ? entry : entry.name;
    const proficiency = typeof entry === 'string' ? 3 : Number(entry.proficiency) || 3;
    const skillId = upsertSkill(name);
    if (skillId) link.run(professionalId, skillId, Math.min(5, Math.max(1, proficiency)));
  }
});

/** Replace the whole skill set of an opportunity in one transaction. */
export const setOpportunitySkills = db.transaction((opportunityId, skills) => {
  db.prepare('DELETE FROM opportunity_skills WHERE opportunity_id = ?').run(opportunityId);
  const link = db.prepare(
    'INSERT OR REPLACE INTO opportunity_skills (opportunity_id, skill_id, weight, required) VALUES (?, ?, ?, ?)'
  );
  for (const entry of skills) {
    const name = typeof entry === 'string' ? entry : entry.name;
    const weight = typeof entry === 'string' ? 1 : Number(entry.weight) || 1;
    const required = typeof entry === 'string' ? 1 : entry.required === false ? 0 : 1;
    const skillId = upsertSkill(name);
    if (skillId) link.run(opportunityId, skillId, weight, required);
  }
});

export function skillsForProfessional(id) {
  return db.prepare(
    `SELECT s.name, ps.proficiency
       FROM professional_skills ps JOIN skills s ON s.id = ps.skill_id
      WHERE ps.professional_id = ? ORDER BY ps.proficiency DESC, s.name`
  ).all(id);
}

export function skillsForOpportunity(id) {
  return db.prepare(
    `SELECT s.name, os.weight, os.required
       FROM opportunity_skills os JOIN skills s ON s.id = os.skill_id
      WHERE os.opportunity_id = ? ORDER BY os.weight DESC, s.name`
  ).all(id);
}

export function getProfessional(id) {
  const row = db.prepare('SELECT * FROM professionals WHERE id = ?').get(id);
  if (!row) return null;
  return { ...row, remote_ok: !!row.remote_ok, skills: skillsForProfessional(id) };
}

export function getOpportunity(id) {
  const row = db.prepare(
    `SELECT o.*, c.name AS company_name, c.sector, c.is_social_enterprise
       FROM opportunities o JOIN companies c ON c.id = o.company_id
      WHERE o.id = ?`
  ).get(id);
  if (!row) return null;
  return { ...row, remote: !!row.remote, skills: skillsForOpportunity(id) };
}

export function listOpportunities({ status = 'open', search = '', remoteOnly = false } = {}) {
  const rows = db.prepare(
    `SELECT o.*, c.name AS company_name, c.sector, c.is_social_enterprise
       FROM opportunities o JOIN companies c ON c.id = o.company_id
      WHERE (? = 'all' OR o.status = ?)
      ORDER BY o.created_at DESC`
  ).all(status, status);

  const term = search.trim().toLowerCase();
  return rows
    .map((row) => ({ ...row, remote: !!row.remote, skills: skillsForOpportunity(row.id) }))
    .filter((row) => (remoteOnly ? row.remote : true))
    .filter((row) =>
      !term ||
      row.title.toLowerCase().includes(term) ||
      row.description.toLowerCase().includes(term) ||
      row.company_name.toLowerCase().includes(term) ||
      row.skills.some((s) => s.name.toLowerCase().includes(term))
    );
}

export function listProfessionals() {
  return db.prepare('SELECT * FROM professionals ORDER BY created_at DESC').all()
    .map((row) => ({ ...row, remote_ok: !!row.remote_ok, skills: skillsForProfessional(row.id) }));
}
