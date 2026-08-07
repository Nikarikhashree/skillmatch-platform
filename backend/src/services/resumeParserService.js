import { askClaudeForJson, claudeEnabled } from './claudeService.js';

const SKILL_DICTIONARY = [
  'javascript', 'typescript', 'react', 'node.js', 'express', 'python', 'java', 'c#', 'sql',
  'postgresql', 'sqlite', 'mongodb', 'aws', 'azure', 'docker', 'kubernetes', 'terraform',
  'ci/cd', 'git', 'rest api', 'graphql', 'machine learning', 'data analysis', 'power bi',
  'tableau', 'excel', 'figma', 'ux research', 'ui design', 'accessibility', 'seo',
  'content strategy', 'copywriting', 'project management', 'agile', 'scrum', 'stakeholder management',
  'change management', 'fundraising', 'grant writing', 'monitoring and evaluation', 'safeguarding',
  'volunteer management', 'financial modelling', 'bookkeeping', 'payroll', 'procurement',
  'supply chain', 'operations', 'hr', 'recruitment', 'training and facilitation', 'coaching',
  'public speaking', 'partnerships', 'business development', 'marketing strategy',
  'social media', 'email marketing', 'crm', 'salesforce', 'customer success', 'quality assurance',
  'cybersecurity', 'networking', 'sales'
];

const SYSTEM = `You extract structured profiles from CV text for a professional matching platform.
Return JSON only, with this exact shape:
{"headline": string, "years_experience": number, "location": string,
 "skills": [{"name": string, "proficiency": 1-5}], "summary": string}
Use at most 12 skills, lower case, no duplicates. Never invent employers or dates.`;

/** Dictionary + heuristic parse. Always available, no network needed. */
export function parseResumeLocally(text) {
  const lower = String(text || '').toLowerCase();

  const skills = SKILL_DICTIONARY
    .filter((skill) => lower.includes(skill))
    .slice(0, 12)
    .map((name) => ({ name, proficiency: 3 }));

  const yearMatches = [...lower.matchAll(/(\d{1,2})\+?\s*years?/g)].map((m) => Number(m[1]));
  const years = yearMatches.length ? Math.max(...yearMatches) : 0;

  const firstLine = String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)[1] || '';

  return {
    headline: firstLine.slice(0, 120),
    years_experience: Math.min(50, years),
    location: '',
    skills,
    summary: String(text || '').slice(0, 400),
    parsed_by: 'rules'
  };
}

/** Claude parse with an automatic fall back to the local parser. */
export async function parseResume(text) {
  if (!claudeEnabled()) return parseResumeLocally(text);

  try {
    const result = await askClaudeForJson({
      system: SYSTEM,
      maxTokens: 900,
      messages: [{ role: 'user', content: `CV text:\n"""\n${String(text).slice(0, 12000)}\n"""` }]
    });

    return {
      headline: String(result.headline || '').slice(0, 120),
      years_experience: Math.min(50, Math.max(0, Number(result.years_experience) || 0)),
      location: String(result.location || ''),
      skills: (result.skills || [])
        .slice(0, 12)
        .map((s) => ({ name: String(s.name || '').toLowerCase(), proficiency: Number(s.proficiency) || 3 }))
        .filter((s) => s.name),
      summary: String(result.summary || '').slice(0, 800),
      parsed_by: 'claude'
    };
  } catch (error) {
    console.warn('[resume] Claude parse failed, using rules:', error.message);
    return parseResumeLocally(text);
  }
}
