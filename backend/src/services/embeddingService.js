import 'dotenv/config';

/**
 * Anthropic does not sell an embeddings model, so semantic matching runs on one
 * of two providers:
 *   voyage - Anthropic's recommended embeddings partner, used when VOYAGE_API_KEY is set
 *   local  - a deterministic hashing vectoriser that needs no network access
 * Both return unit-length vectors, so cosine similarity is just a dot product.
 */

const DIMENSIONS = 512;

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'have',
  'in', 'into', 'is', 'it', 'its', 'of', 'on', 'or', 'our', 'that', 'the', 'their',
  'this', 'to', 'was', 'we', 'were', 'will', 'with', 'you', 'your'
]);

export function activeProvider() {
  return process.env.VOYAGE_API_KEY ? 'voyage' : 'local';
}

export function embeddingModelName() {
  return activeProvider() === 'voyage'
    ? process.env.VOYAGE_MODEL || 'voyage-3.5-lite'
    : `local-hash-${DIMENSIONS}`;
}

function tokenise(text) {
  const words = String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9+#. ]+/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOPWORDS.has(word));

  const grams = [...words];
  for (let i = 0; i < words.length - 1; i += 1) grams.push(`${words[i]}_${words[i + 1]}`);
  return grams;
}

function hash(token) {
  let value = 2166136261;
  for (let i = 0; i < token.length; i += 1) {
    value ^= token.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return Math.abs(value);
}

/** Sublinear term frequency over a hashed vocabulary, L2 normalised. */
export function localEmbedding(text) {
  const counts = new Map();
  for (const token of tokenise(text)) counts.set(token, (counts.get(token) || 0) + 1);

  const vector = new Array(DIMENSIONS).fill(0);
  for (const [token, count] of counts) {
    const bucket = hash(token) % DIMENSIONS;
    const sign = hash(`${token}#sign`) % 2 === 0 ? 1 : -1;
    vector[bucket] += sign * (1 + Math.log(count));
  }
  return normalise(vector);
}

export function normalise(vector) {
  const length = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  return length === 0 ? vector : vector.map((value) => value / length);
}

async function voyageEmbeddings(texts) {
  const response = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`
    },
    body: JSON.stringify({
      model: process.env.VOYAGE_MODEL || 'voyage-3.5-lite',
      input: texts
    })
  });

  if (!response.ok) throw new Error(`Voyage API returned ${response.status}`);
  const payload = await response.json();
  return payload.data
    .sort((a, b) => a.index - b.index)
    .map((item) => normalise(item.embedding));
}

/** Embed a batch of strings. Falls back to the local vectoriser on any failure. */
export async function embedMany(texts) {
  if (activeProvider() === 'voyage') {
    try {
      return await voyageEmbeddings(texts);
    } catch (error) {
      console.warn('[embeddings] Voyage call failed, using local vectoriser:', error.message);
    }
  }
  return texts.map(localEmbedding);
}

export async function embed(text) {
  const [vector] = await embedMany([text]);
  return vector;
}

export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i += 1) dot += a[i] * b[i];
  return dot;
}

/** Text used to build a professional's vector. Skills are repeated so they carry weight. */
export function professionalText(professional) {
  const skills = (professional.skills || []).map((s) => s.name).join(', ');
  return [
    professional.headline,
    professional.bio,
    `Skills: ${skills}. ${skills}`,
    `${professional.years_experience} years of experience.`,
    professional.location,
    (professional.resume_text || '').slice(0, 4000)
  ].filter(Boolean).join('\n');
}

export function opportunityText(opportunity) {
  const skills = (opportunity.skills || []).map((s) => s.name).join(', ');
  return [
    opportunity.title,
    opportunity.description,
    `Skills needed: ${skills}. ${skills}`,
    `${opportunity.engagement_type} engagement, ${opportunity.duration_weeks} weeks, ` +
      `${opportunity.weekly_hours} hours a week.`,
    opportunity.remote ? 'Remote friendly.' : `On site in ${opportunity.location}.`,
    opportunity.sector
  ].filter(Boolean).join('\n');
}
