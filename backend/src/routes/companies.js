import { Router } from 'express';
import {
  db, getOpportunity, listOpportunities, setOpportunitySkills
} from '../db/index.js';
import { indexOpportunity } from '../services/matchingService.js';

const router = Router();

router.get('/', (req, res) => {
  res.json(db.prepare(
    `SELECT c.*, COUNT(o.id) AS opportunity_count
       FROM companies c LEFT JOIN opportunities o ON o.company_id = c.id
      GROUP BY c.id ORDER BY c.name`
  ).all());
});

router.post('/', (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Organisation name is needed' });

  const existing = db.prepare('SELECT * FROM companies WHERE name = ?').get(name);
  if (existing) return res.json(existing);

  const info = db.prepare(
    `INSERT INTO companies (name, sector, contact_email, location, is_social_enterprise)
     VALUES (?, ?, ?, ?, ?)`
  ).run(
    name,
    String(req.body.sector || '').trim(),
    String(req.body.contact_email || '').trim(),
    String(req.body.location || '').trim(),
    req.body.is_social_enterprise ? 1 : 0
  );

  res.status(201).json(db.prepare('SELECT * FROM companies WHERE id = ?').get(info.lastInsertRowid));
});

/** Opportunities live under companies because every project has an owner. */
router.get('/opportunities/all', (req, res) => {
  res.json(listOpportunities({
    status: String(req.query.status || 'open'),
    search: String(req.query.search || ''),
    remoteOnly: req.query.remote === 'true'
  }));
});

router.get('/opportunities/:id', (req, res) => {
  const opportunity = getOpportunity(Number(req.params.id));
  if (!opportunity) return res.status(404).json({ error: 'Project not found' });
  res.json(opportunity);
});

router.post('/opportunities', async (req, res, next) => {
  try {
    const title = String(req.body.title || '').trim();
    const companyName = String(req.body.company_name || '').trim();
    if (!title || !companyName) {
      return res.status(400).json({ error: 'Project title and organisation name are both needed' });
    }

    db.prepare('INSERT OR IGNORE INTO companies (name, sector, location, is_social_enterprise) VALUES (?, ?, ?, ?)')
      .run(companyName, String(req.body.sector || ''), String(req.body.location || ''), req.body.is_social_enterprise ? 1 : 0);
    const company = db.prepare('SELECT * FROM companies WHERE name = ?').get(companyName);

    const info = db.prepare(
      `INSERT INTO opportunities
         (company_id, title, description, engagement_type, duration_weeks, weekly_hours,
          remote, location, min_experience, budget_band, status)
       VALUES (@company_id, @title, @description, @engagement_type, @duration_weeks, @weekly_hours,
               @remote, @location, @min_experience, @budget_band, 'open')`
    ).run({
      company_id: company.id,
      title,
      description: String(req.body.description || '').trim(),
      engagement_type: String(req.body.engagement_type || 'project'),
      duration_weeks: Math.max(1, Math.min(104, Number(req.body.duration_weeks) || 8)),
      weekly_hours: Math.max(1, Math.min(60, Number(req.body.weekly_hours) || 10)),
      remote: req.body.remote === false || req.body.remote === 'false' ? 0 : 1,
      location: String(req.body.location || ''),
      min_experience: Math.max(0, Math.min(40, Number(req.body.min_experience) || 0)),
      budget_band: String(req.body.budget_band || '')
    });

    const id = Number(info.lastInsertRowid);
    setOpportunitySkills(id, req.body.skills || []);
    await indexOpportunity(id);
    res.status(201).json(getOpportunity(id));
  } catch (error) {
    next(error);
  }
});

router.patch('/opportunities/:id/status', (req, res) => {
  const status = String(req.body.status || '');
  if (!['open', 'filled', 'closed'].includes(status)) {
    return res.status(400).json({ error: 'Status must be open, filled or closed' });
  }
  const info = db.prepare('UPDATE opportunities SET status = ? WHERE id = ?').run(status, Number(req.params.id));
  if (!info.changes) return res.status(404).json({ error: 'Project not found' });
  res.json(getOpportunity(Number(req.params.id)));
});

export default router;
