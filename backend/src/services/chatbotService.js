import { db, listOpportunities } from '../db/index.js';
import { askClaude, claudeEnabled } from './claudeService.js';
import { impactSnapshot } from './analyticsService.js';

const PLATFORM_FACTS = `SkillMatch connects experienced professionals with project based work at
small businesses and social enterprises. Professionals build a skill profile or paste a CV, and the
platform ranks open projects for them. Organisations post a project and get a ranked shortlist with a
written reason for each name. Matching blends semantic similarity of the two texts, weighted skill
coverage, and a practical fit check on hours, location and seniority. There is no fee for
professionals. Social enterprises get the impact dashboard for free.`;

/** Small retrieval step: the live opportunity list plus headline numbers. */
function knowledgeBase() {
  const openRoles = listOpportunities({ status: 'open' }).slice(0, 12).map((o) =>
    `- ${o.title} at ${o.company_name} (${o.sector}). ${o.duration_weeks} weeks, ${o.weekly_hours}h a week, ` +
    `${o.remote ? 'remote' : `on site in ${o.location}`}. Skills: ${o.skills.map((s) => s.name).join(', ')}.`
  ).join('\n');

  const { totals } = impactSnapshot();

  return `${PLATFORM_FACTS}

Live numbers: ${totals.professionals} professionals, ${totals.open_opportunities} open projects,
${totals.companies} organisations, ${totals.placements} placements so far.

Open projects right now:
${openRoles || '- none yet'}`;
}

const SYSTEM = `You are the support assistant for SkillMatch. Answer in British English, in two or
three short sentences, using only the context provided. If the answer is not in the context, say so
and point the person at the relevant page (Browse projects, Join as a professional, Post a project,
Impact dashboard). Never invent projects, fees or numbers.`;

function fallbackReply(question) {
  const roles = listOpportunities({ status: 'open' }).slice(0, 3);
  const q = question.toLowerCase();

  if (q.includes('match') || q.includes('how does')) {
    return 'Matching blends three things: how close your profile text is to the project text, how much of the required skill list you cover, and whether the hours, location and seniority work. Every result comes with a written reason so you can argue with it.';
  }
  if (q.includes('cost') || q.includes('fee') || q.includes('pay') || q.includes('price')) {
    return 'It is free for professionals, and social enterprises get the impact dashboard at no cost too.';
  }
  if (q.includes('project') || q.includes('opportunit') || q.includes('role') || q.includes('job')) {
    return roles.length
      ? `There are open projects such as ${roles.map((r) => `${r.title} at ${r.company_name}`).join(', ')}. Open Browse projects to see the full list with fit scores.`
      : 'There are no open projects on the board yet. Post one from the organisation portal to get started.';
  }
  if (q.includes('sign up') || q.includes('start') || q.includes('profile') || q.includes('cv')) {
    return 'Open Join as a professional, paste your CV or fill the short form, and the platform builds your profile and ranks open projects for you straight away.';
  }
  return 'I can help with how matching works, what projects are open, and how to set up a profile or post a project. Ask me one of those and I will point you to the right page.';
}

export async function answerQuestion(question, history = []) {
  if (!claudeEnabled()) {
    return { reply: fallbackReply(question), answered_by: 'rules' };
  }

  try {
    const messages = [
      ...history.slice(-6).map((turn) => ({
        role: turn.role === 'assistant' ? 'assistant' : 'user',
        content: String(turn.content).slice(0, 2000)
      })),
      { role: 'user', content: `Context:\n${knowledgeBase()}\n\nQuestion: ${question}` }
    ];

    const reply = await askClaude({ system: SYSTEM, messages, maxTokens: 400, temperature: 0.3 });
    return { reply, answered_by: 'claude' };
  } catch (error) {
    console.warn('[chatbot] Claude call failed, using rules:', error.message);
    return { reply: fallbackReply(question), answered_by: 'rules' };
  }
}
