import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import professionals from './routes/professionals.js';
import companies from './routes/companies.js';
import matches from './routes/matches.js';
import chatbot from './routes/chatbot.js';
import analytics from './routes/analytics.js';

import { activeProvider, embeddingModelName } from './services/embeddingService.js';
import { claudeEnabled } from './services/claudeService.js';

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }));

// Vectors are internal, so they never travel to the browser.
app.set('json replacer', (key, value) => (key === 'embedding' ? undefined : value));
app.use(express.json({ limit: '2mb' }));

app.use((req, res, next) => {
  const started = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - started}ms`);
  });
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    claude: claudeEnabled() ? 'live' : 'fallback',
    embeddings: activeProvider(),
    embedding_model: embeddingModelName()
  });
});

app.use('/api/professionals', professionals);
app.use('/api/companies', companies);
app.use('/api/matches', matches);
app.use('/api/chatbot', chatbot);
app.use('/api/analytics', analytics);

app.use((req, res) => res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` }));

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: error.message || 'Something went wrong on the server' });
});

app.listen(port, () => {
  console.log(`SkillMatch API on http://localhost:${port}`);
  console.log(`Claude: ${claudeEnabled() ? 'live' : 'fallback templates'} | Embeddings: ${embeddingModelName()}`);
});
