import { Router } from 'express';
import multer from 'multer';
import {
  db, getProfessional, listProfessionals, setProfessionalSkills
} from '../db/index.js';
import { indexProfessional, matchesForProfessional } from '../services/matchingService.js';
import { parseResume } from '../services/resumeParserService.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

function clean(body) {
  return {
    full_name: String(body.full_name || '').trim(),
    email: String(body.email || '').trim().toLowerCase(),
    headline: String(body.headline || '').trim(),
    bio: String(body.bio || '').trim(),
    location: String(body.location || '').trim(),
    years_experience: Math.max(0, Math.min(60, Number(body.years_experience) || 0)),
    weekly_hours: Math.max(1, Math.min(60, Number(body.weekly_hours) || 10)),
    remote_ok: body.remote_ok === false || body.remote_ok === 'false' ? 0 : 1,
    resume_text: String(body.resume_text || '').slice(0, 20000)
  };
}

router.get('/', (req, res) => {
  res.json(listProfessionals());
});

router.get('/:id', (req, res) => {
  const professional = getProfessional(Number(req.params.id));
  if (!professional) return res.status(404).json({ error: 'Professional not found' });
  res.json(professional);
});

router.post('/', async (req, res, next) => {
  try {
    const data = clean(req.body);
    if (!data.full_name || !data.email) {
      return res.status(400).json({ error: 'Name and email are both needed' });
    }
    if (db.prepare('SELECT id FROM professionals WHERE email = ?').get(data.email)) {
      return res.status(409).json({ error: 'That email already has a profile' });
    }

    const info = db.prepare(
      `INSERT INTO professionals
         (full_name, email, headline, bio, location, years_experience, weekly_hours, remote_ok, resume_text)
       VALUES (@full_name, @email, @headline, @bio, @location, @years_experience, @weekly_hours, @remote_ok, @resume_text)`
    ).run(data);

    const id = Number(info.lastInsertRowid);
    setProfessionalSkills(id, req.body.skills || []);
    await indexProfessional(id);
    res.status(201).json(getProfessional(id));
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!getProfessional(id)) return res.status(404).json({ error: 'Professional not found' });

    const data = clean(req.body);
    db.prepare(
      `UPDATE professionals SET
         full_name = @full_name, headline = @headline, bio = @bio, location = @location,
         years_experience = @years_experience, weekly_hours = @weekly_hours,
         remote_ok = @remote_ok, resume_text = @resume_text
       WHERE id = @id`
    ).run({ ...data, id });

    if (Array.isArray(req.body.skills)) setProfessionalSkills(id, req.body.skills);
    await indexProfessional(id);
    res.json(getProfessional(id));
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM professionals WHERE id = ?').run(Number(req.params.id));
  if (!info.changes) return res.status(404).json({ error: 'Professional not found' });
  res.status(204).end();
});

/** Ranked open projects for one professional. */
router.get('/:id/matches', async (req, res, next) => {
  try {
    const result = await matchesForProfessional(Number(req.params.id), {
      limit: Math.min(20, Number(req.query.limit) || 5),
      explain: req.query.explain !== 'false'
    });
    if (!result) return res.status(404).json({ error: 'Professional not found' });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Turn CV text into a draft profile. Accepts a .txt or .md upload on `resume`,
 * or raw text in the JSON body as `text`.
 */
router.post('/parse-resume', upload.single('resume'), async (req, res, next) => {
  try {
    const uploaded = req.file ? req.file.buffer.toString('utf8') : '';
    const text = uploaded || String(req.body.text || '');
    if (text.trim().length < 40) {
      return res.status(400).json({ error: 'Paste at least a few lines of CV text, or upload a .txt or .md file' });
    }
    res.json(await parseResume(text));
  } catch (error) {
    next(error);
  }
});

export default router;
