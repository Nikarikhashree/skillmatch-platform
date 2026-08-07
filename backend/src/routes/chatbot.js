import { Router } from 'express';
import { answerQuestion } from '../services/chatbotService.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const question = String(req.body.message || '').trim();
    if (!question) return res.status(400).json({ error: 'Type a question first' });
    const history = Array.isArray(req.body.history) ? req.body.history : [];
    res.json(await answerQuestion(question, history));
  } catch (error) {
    next(error);
  }
});

export default router;
