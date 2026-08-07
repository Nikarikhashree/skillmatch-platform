import { db, getOpportunity, getProfessional, listOpportunities, listProfessionals } from '../db/index.js';
import {
  cosineSimilarity, embed, embeddingModelName, opportunityText, professionalText
} from './embeddingService.js';
import { askClaude, claudeEnabled } from './claudeService.js';

export const WEIGHTS = { semantic: 0.5, skills: 0.35, logistics: 0.15 };

/* ------------------------------------------------------------------ vectors */

function readVector(row) {
  try {
    return row.embedding ? JSON.parse(row.embedding) : null;
  } catch {
    return null;
  }
}

export async function indexProfessional(id) {
  const professional = getProfessional(id);
  if (!professional) return null;
  const vector = await embed(professionalText(professional));
  db.prepare('UPDATE professionals SET embedding = ?, embedding_model = ? WHERE id = ?')
    .run(JSON.stringify(vector), embeddingModelName(), id);
  return vector;
}

export async function indexOpportunity(id) {
  const opportunity = getOpportunity(id);
  if (!opportunity) return null;
  const vector = await embed(opportunityText(opportunity));
  db.prepare('UPDATE opportunities SET embedding = ?, embedding_model = ? WHERE id = ?')
    .run(JSON.stringify(vector), embeddingModelName(), id);
  return vector;
}

async function vectorForProfessional(professional) {
  const existing = readVector(professional);
  if (existing && professional.embedding_model === embeddingModelName()) return existing;
  return indexProfessional(professional.id);
}

async function vectorForOpportunity(opportunity) {
  const existing = readVector(opportunity);
  if (existing && opportunity.embedding_model === embeddingModelName()) return existing;
  return indexOpportunity(opportunity.id);
}

/* ------------------------------------------------------------------- scores */

const normaliseSkill = (name) => String(name || '').toLowerCase().trim();

function skillFit(professional, opportunity) {
  const held = new Map(
    (professional.skills || []).map((s) => [normaliseSkill(s.name), s.proficiency || 3])
  );
  const wanted = opportunity.skills || [];
  if (!wanted.length) return { score: 0.5, matched: [], missing: [] };

  const matched = [];
  const missing = [];
  let earned = 0;
  let total = 0;

  for (const want of wanted) {
    const name = normaliseSkill(want.name);
    const weight = Number(want.weight) || 1;
    total += weight;

    let proficiency = held.get(name);
    if (proficiency === undefined) {
      const partial = [...held.keys()].find((key) => key.includes(name) || name.includes(key));
      if (partial) proficiency = held.get(partial) * 0.8;
    }

    if (proficiency === undefined) {
      missing.push(want.name);
    } else {
      matched.push(want.name);
      earned += weight * (0.6 + 0.4 * (Math.min(5, proficiency) / 5));
    }
  }

  return { score: total ? earned / total : 0, matched, missing };
}

function logisticsFit(professional, opportunity) {
  const notes = [];
  let score = 1;

  if (!opportunity.remote) {
    const sameCity = normaliseSkill(professional.location) &&
      normaliseSkill(opportunity.location).includes(normaliseSkill(professional.location).split(',')[0]);
    if (!sameCity) {
      score -= 0.35;
      notes.push(`on site in ${opportunity.location || 'the client office'}`);
    }
  }

  if (professional.weekly_hours < opportunity.weekly_hours) {
    const shortfall = (opportunity.weekly_hours - professional.weekly_hours) / Math.max(1, opportunity.weekly_hours);
    score -= Math.min(0.4, shortfall);
    notes.push(`available ${professional.weekly_hours}h a week against ${opportunity.weekly_hours}h asked`);
  }

  if (professional.years_experience < opportunity.min_experience) {
    score -= 0.25;
    notes.push(`${professional.years_experience} years experience against ${opportunity.min_experience} asked`);
  }

  return { score: Math.max(0, Math.min(1, score)), notes };
}

/** Blend the three signals into one 0-100 score. */
export async function scorePair(professional, opportunity) {
  const [proVector, oppVector] = await Promise.all([
    vectorForProfessional(professional),
    vectorForOpportunity(opportunity)
  ]);

  const raw = cosineSimilarity(proVector, oppVector);
  const semantic = Math.max(0, Math.min(1, (raw + 1) / 2 * 1.15 - 0.075));
  const skills = skillFit(professional, opportunity);
  const logistics = logisticsFit(professional, opportunity);

  const score =
    WEIGHTS.semantic * semantic +
    WEIGHTS.skills * skills.score +
    WEIGHTS.logistics * logistics.score;

  return {
    score: Math.round(score * 1000) / 10,
    semantic_score: Math.round(semantic * 1000) / 10,
    skill_score: Math.round(skills.score * 1000) / 10,
    logistics_score: Math.round(logistics.score * 1000) / 10,
    matched_skills: skills.matched,
    missing_skills: skills.missing,
    logistics_notes: logistics.notes
  };
}

/* -------------------------------------------------------------- explanation */

function templateExplanation(professional, opportunity, breakdown) {
  const parts = [];
  parts.push(
    `${professional.full_name} scores ${breakdown.score} out of 100 for ${opportunity.title} at ${opportunity.company_name}.`
  );
  if (breakdown.matched_skills.length) {
    parts.push(`Direct overlap on ${breakdown.matched_skills.join(', ')}.`);
  }
  if (breakdown.missing_skills.length) {
    parts.push(`Nothing on file for ${breakdown.missing_skills.join(', ')}, so probe that in a first call.`);
  }
  parts.push(
    breakdown.logistics_notes.length
      ? `Practical watch outs: ${breakdown.logistics_notes.join('; ')}.`
      : 'Hours, location and seniority all line up.'
  );
  return parts.join(' ');
}

const EXPLAIN_SYSTEM = `You explain why a professional fits a project on a matching platform.
Write two or three sentences, British English, plain and concrete. Name the real overlap,
then name the single biggest gap or risk. Never invent experience that is not in the profile.
Do not use bullet points or headings.`;

export async function explainMatch(professional, opportunity, breakdown) {
  if (!claudeEnabled()) {
    return { explanation: templateExplanation(professional, opportunity, breakdown), explained_by: 'rules' };
  }

  try {
    const text = await askClaude({
      system: EXPLAIN_SYSTEM,
      maxTokens: 320,
      messages: [{
        role: 'user',
        content:
`PROFESSIONAL
Name: ${professional.full_name}
Headline: ${professional.headline}
Experience: ${professional.years_experience} years, ${professional.weekly_hours}h a week, ${professional.location}
Skills: ${(professional.skills || []).map((s) => `${s.name} (${s.proficiency}/5)`).join(', ')}
Bio: ${professional.bio}

OPPORTUNITY
${opportunity.title} at ${opportunity.company_name} (${opportunity.sector})
${opportunity.description}
Skills wanted: ${(opportunity.skills || []).map((s) => s.name).join(', ')}
Shape: ${opportunity.engagement_type}, ${opportunity.duration_weeks} weeks, ${opportunity.weekly_hours}h a week, ${opportunity.remote ? 'remote' : `on site in ${opportunity.location}`}

SCORES
Overall ${breakdown.score}, semantic ${breakdown.semantic_score}, skills ${breakdown.skill_score}, logistics ${breakdown.logistics_score}
Matched skills: ${breakdown.matched_skills.join(', ') || 'none'}
Missing skills: ${breakdown.missing_skills.join(', ') || 'none'}
Logistics notes: ${breakdown.logistics_notes.join('; ') || 'none'}`
      }]
    });
    return { explanation: text, explained_by: 'claude' };
  } catch (error) {
    console.warn('[matching] Claude explanation failed, using template:', error.message);
    return { explanation: templateExplanation(professional, opportunity, breakdown), explained_by: 'rules' };
  }
}

/* --------------------------------------------------------------- persistence */

const saveMatch = db.prepare(
  `INSERT INTO matches
     (professional_id, opportunity_id, score, semantic_score, skill_score, logistics_score, explanation, explained_by)
   VALUES (@professional_id, @opportunity_id, @score, @semantic_score, @skill_score, @logistics_score, @explanation, @explained_by)
   ON CONFLICT (professional_id, opportunity_id) DO UPDATE SET
     score = excluded.score,
     semantic_score = excluded.semantic_score,
     skill_score = excluded.skill_score,
     logistics_score = excluded.logistics_score,
     explanation = CASE WHEN excluded.explanation = '' THEN matches.explanation ELSE excluded.explanation END,
     explained_by = excluded.explained_by,
     created_at = datetime('now')`
);

function persist(professionalId, opportunityId, breakdown, explanation = '', explainedBy = 'rules') {
  saveMatch.run({
    professional_id: professionalId,
    opportunity_id: opportunityId,
    score: breakdown.score,
    semantic_score: breakdown.semantic_score,
    skill_score: breakdown.skill_score,
    logistics_score: breakdown.logistics_score,
    explanation,
    explained_by: explainedBy
  });
}

/** Rank every professional against one opportunity. */
export async function matchesForOpportunity(opportunityId, { limit = 5, explain = true } = {}) {
  const opportunity = getOpportunity(opportunityId);
  if (!opportunity) return null;

  const candidates = listProfessionals();
  const scored = [];
  for (const professional of candidates) {
    const breakdown = await scorePair(professional, opportunity);
    scored.push({ professional, breakdown });
  }

  scored.sort((a, b) => b.breakdown.score - a.breakdown.score);
  const top = scored.slice(0, limit);

  const results = [];
  for (const { professional, breakdown } of top) {
    const { explanation, explained_by } = explain
      ? await explainMatch(professional, opportunity, breakdown)
      : { explanation: '', explained_by: 'rules' };
    persist(professional.id, opportunity.id, breakdown, explanation, explained_by);
    results.push({
      professional_id: professional.id,
      full_name: professional.full_name,
      headline: professional.headline,
      location: professional.location,
      years_experience: professional.years_experience,
      skills: professional.skills,
      explanation,
      explained_by,
      ...breakdown
    });
  }

  return { opportunity, matches: results };
}

/** Rank every open opportunity against one professional. */
export async function matchesForProfessional(professionalId, { limit = 5, explain = true } = {}) {
  const professional = getProfessional(professionalId);
  if (!professional) return null;

  const openRoles = listOpportunities({ status: 'open' });
  const scored = [];
  for (const opportunity of openRoles) {
    const breakdown = await scorePair(professional, opportunity);
    scored.push({ opportunity, breakdown });
  }

  scored.sort((a, b) => b.breakdown.score - a.breakdown.score);
  const top = scored.slice(0, limit);

  const results = [];
  for (const { opportunity, breakdown } of top) {
    const { explanation, explained_by } = explain
      ? await explainMatch(professional, opportunity, breakdown)
      : { explanation: '', explained_by: 'rules' };
    persist(professional.id, opportunity.id, breakdown, explanation, explained_by);
    results.push({
      opportunity_id: opportunity.id,
      title: opportunity.title,
      company_name: opportunity.company_name,
      sector: opportunity.sector,
      remote: opportunity.remote,
      location: opportunity.location,
      duration_weeks: opportunity.duration_weeks,
      weekly_hours: opportunity.weekly_hours,
      skills: opportunity.skills,
      explanation,
      explained_by,
      ...breakdown
    });
  }

  return { professional, matches: results };
}
