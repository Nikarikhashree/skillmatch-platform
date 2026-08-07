import { Router } from 'express';
import { db } from '../db/index.js';
import { impactSnapshot, recordImpactEvent } from '../services/analyticsService.js';

const router = Router();

router.get('/', (req, res) => res.json(impactSnapshot()));

router.post('/events', (req, res) => {
  const eventType = String(req.body.event_type || '').trim();
  if (!eventType) return res.status(400).json({ error: 'Event type is needed' });
  res.status(201).json(recordImpactEvent({
    event_type: eventType,
    value: Number(req.body.value) || 1,
    programme: String(req.body.programme || ''),
    note: String(req.body.note || '')
  }));
});

/** Volunteer sign up. */
router.post('/volunteers', (req, res) => {
  const full_name = String(req.body.full_name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!full_name || !email) return res.status(400).json({ error: 'Name and email are both needed' });

  try {
    const info = db.prepare(
      `INSERT INTO volunteers (full_name, email, skills_text, hours_pledged, programme)
       VALUES (?, ?, ?, ?, ?)`
    ).run(
      full_name, email,
      String(req.body.skills_text || ''),
      Math.max(0, Number(req.body.hours_pledged) || 0),
      String(req.body.programme || '')
    );
    res.status(201).json(db.prepare('SELECT * FROM volunteers WHERE id = ?').get(info.lastInsertRowid));
  } catch {
    res.status(409).json({ error: 'That email is already signed up' });
  }
});

router.get('/volunteers', (req, res) => {
  res.json(db.prepare('SELECT * FROM volunteers ORDER BY created_at DESC').all());
});

/**
 * Beneficiary intake. Names are never stored: the form sends a reference code
 * so the dashboard can report on cohorts without holding personal data.
 */
router.post('/beneficiaries', (req, res) => {
  const reference_code = String(req.body.reference_code || '').trim().toUpperCase();
  if (!reference_code) return res.status(400).json({ error: 'A reference code is needed' });
  if (!req.body.consent_given) return res.status(400).json({ error: 'Record consent before saving an intake' });

  try {
    const info = db.prepare(
      `INSERT INTO beneficiaries (reference_code, age_band, programme, referral_source, support_needs, consent_given)
       VALUES (?, ?, ?, ?, ?, 1)`
    ).run(
      reference_code,
      String(req.body.age_band || ''),
      String(req.body.programme || ''),
      String(req.body.referral_source || ''),
      String(req.body.support_needs || '')
    );
    res.status(201).json(db.prepare('SELECT * FROM beneficiaries WHERE id = ?').get(info.lastInsertRowid));
  } catch {
    res.status(409).json({ error: 'That reference code is already on file' });
  }
});

router.get('/beneficiaries', (req, res) => {
  res.json(db.prepare('SELECT * FROM beneficiaries ORDER BY created_at DESC').all());
});

export default router;
