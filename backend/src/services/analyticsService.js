import { db } from '../db/index.js';

const one = (sql, ...args) => db.prepare(sql).get(...args);
const all = (sql, ...args) => db.prepare(sql).all(...args);

/** Everything the impact dashboard needs, in one query set. */
export function impactSnapshot() {
  const totals = {
    professionals: one('SELECT COUNT(*) AS n FROM professionals').n,
    companies: one('SELECT COUNT(*) AS n FROM companies').n,
    social_enterprises: one('SELECT COUNT(*) AS n FROM companies WHERE is_social_enterprise = 1').n,
    open_opportunities: one("SELECT COUNT(*) AS n FROM opportunities WHERE status = 'open'").n,
    matches_generated: one('SELECT COUNT(*) AS n FROM matches').n,
    strong_matches: one('SELECT COUNT(*) AS n FROM matches WHERE score >= 70').n,
    placements: one("SELECT COUNT(*) AS n FROM applications WHERE status = 'placed'").n,
    volunteers: one('SELECT COUNT(*) AS n FROM volunteers').n,
    beneficiaries: one('SELECT COUNT(*) AS n FROM beneficiaries').n,
    hours_contributed:
      (one('SELECT COALESCE(SUM(hours_logged), 0) AS n FROM applications').n || 0) +
      (one("SELECT COALESCE(SUM(value), 0) AS n FROM impact_events WHERE event_type = 'hours_contributed'").n || 0),
    volunteer_hours_pledged: one('SELECT COALESCE(SUM(hours_pledged), 0) AS n FROM volunteers').n
  };

  const averageScore = one('SELECT ROUND(AVG(score), 1) AS n FROM matches').n || 0;

  const topSkills = all(
    `SELECT s.name, COUNT(*) AS demand
       FROM opportunity_skills os JOIN skills s ON s.id = os.skill_id
      GROUP BY s.name ORDER BY demand DESC, s.name LIMIT 8`
  );

  const skillGaps = all(
    `SELECT s.name,
            COUNT(DISTINCT os.opportunity_id) AS demand,
            COUNT(DISTINCT ps.professional_id) AS supply
       FROM skills s
       LEFT JOIN opportunity_skills os ON os.skill_id = s.id
       LEFT JOIN professional_skills ps ON ps.skill_id = s.id
      GROUP BY s.name
     HAVING demand > 0
      ORDER BY (demand - supply) DESC LIMIT 6`
  );

  const bySector = all(
    `SELECT c.sector, COUNT(o.id) AS opportunities
       FROM companies c LEFT JOIN opportunities o ON o.company_id = c.id
      GROUP BY c.sector ORDER BY opportunities DESC`
  );

  const programmes = all(
    `SELECT programme, COUNT(*) AS beneficiaries
       FROM beneficiaries GROUP BY programme ORDER BY beneficiaries DESC`
  );

  const matchTimeline = all(
    `SELECT date(created_at) AS day, COUNT(*) AS matches, ROUND(AVG(score), 1) AS avg_score
       FROM matches GROUP BY day ORDER BY day DESC LIMIT 14`
  ).reverse();

  const applicationFunnel = all(
    `SELECT status, COUNT(*) AS n FROM applications GROUP BY status ORDER BY n DESC`
  );

  return { totals, averageScore, topSkills, skillGaps, bySector, programmes, matchTimeline, applicationFunnel };
}

export function recordImpactEvent({ event_type, value = 1, programme = '', note = '' }) {
  const info = db.prepare(
    'INSERT INTO impact_events (event_type, value, programme, note) VALUES (?, ?, ?, ?)'
  ).run(event_type, value, programme, note);
  return db.prepare('SELECT * FROM impact_events WHERE id = ?').get(info.lastInsertRowid);
}
