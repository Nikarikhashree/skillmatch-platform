import { Router } from 'express';
import { db, getOpportunity, getProfessional } from '../db/index.js';
import { matchesForOpportunity, scorePair, explainMatch, WEIGHTS } from '../services/matchingService.js';

const router = Router();

/** How the score is put together, so the UI can show the weights honestly. */
router.get('/weights', (req, res) => res.json(WEIGHTS));

/** Ranked shortlist of professionals for one project. */
router.get('/opportunity/:id', async (req, res, next) => {
  try {
    const result = await matchesForOpportunity(Number(req.params.id), {
      limit: Math.min(20, Number(req.query.limit) || 5),
      explain: req.query.explain !== 'false'
    });
    if (!result) return res.status(404).json({ error: 'Project not found' });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/** Score one pair on demand, with a written reason. */
router.get('/pair/:professionalId/:opportunityId', async (req, res, next) => {
  try {
    const professional = getProfessional(Number(req.params.professionalId));
    const opportunity = getOpportunity(Number(req.params.opportunityId));
    if (!professional || !opportunity) return res.status(404).json({ error: 'Professional or project not found' });

    const breakdown = await scorePair(professional, opportunity);
    const { explanation, explained_by } = await explainMatch(professional, opportunity, breakdown);
    res.json({ professional, opportunity, ...breakdown, explanation, explained_by });
  } catch (error) {
    next(error);
  }
});

/** Apply to a project. */
router.post('/applications', (req, res) => {
  const professionalId = Number(req.body.professional_id);
  const opportunityId = Number(req.body.opportunity_id);
  if (!getProfessional(professionalId) || !getOpportunity(opportunityId)) {
    return res.status(404).json({ error: 'Professional or project not found' });
  }

  db.prepare(
    `INSERT INTO applications (professional_id, opportunity_id, status)
     VALUES (?, ?, 'applied')
     ON CONFLICT (professional_id, opportunity_id) DO NOTHING`
  ).run(professionalId, opportunityId);

  res.status(201).json(
    db.prepare('SELECT * FROM applications WHERE professional_id = ? AND opportunity_id = ?')
      .get(professionalId, opportunityId)
  );
});

router.patch('/applications/:id', (req, res) => {
  const status = String(req.body.status || '');
  if (!['applied', 'shortlisted', 'placed', 'declined'].includes(status)) {
    return res.status(400).json({ error: 'Status must be applied, shortlisted, placed or declined' });
  }
  const hours = Math.max(0, Number(req.body.hours_logged) || 0);
  const info = db.prepare('UPDATE applications SET status = ?, hours_logged = ? WHERE id = ?')
    .run(status, hours, Number(req.params.id));
  if (!info.changes) return res.status(404).json({ error: 'Application not found' });
  res.json(db.prepare('SELECT * FROM applications WHERE id = ?').get(Number(req.params.id)));
});

router.get('/applications', (req, res) => {
  res.json(db.prepare(
    `SELECT a.*, p.full_name, o.title, c.name AS company_name
       FROM applications a
       JOIN professionals p ON p.id = a.professional_id
       JOIN opportunities o ON o.id = a.opportunity_id
       JOIN companies c ON c.id = o.company_id
      ORDER BY a.created_at DESC`
  ).all());
});

export default router;
