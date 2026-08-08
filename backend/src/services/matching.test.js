import test from 'node:test';
import assert from 'node:assert/strict';
import { skillFit, logisticsFit } from './matchingService.js';
import { localEmbedding, cosineSimilarity } from './embeddingService.js';

const pro = (skills, extra = {}) => ({
  skills: skills.map(([name, proficiency]) => ({ name, proficiency })),
  location: 'Leeds, UK', weekly_hours: 10, years_experience: 10, ...extra
});
const opp = (skills, extra = {}) => ({
  skills: skills.map(([name, weight]) => ({ name, weight })),
  location: 'Leeds, UK', weekly_hours: 10, min_experience: 5, remote: 1, ...extra
});

test('full coverage scores near the top', () => {
  const fit = skillFit(pro([['sql', 5], ['excel', 5]]), opp([['sql', 2], ['excel', 2]]));
  assert.ok(fit.score > 0.9);
  assert.equal(fit.missing.length, 0);
});

test('missing skills are reported, not silently dropped', () => {
  const fit = skillFit(pro([['sql', 4]]), opp([['sql', 2], ['figma', 2]]));
  assert.deepEqual(fit.missing, ['figma']);
  assert.ok(fit.score > 0.4 && fit.score < 0.6);
});

test('must haves outweigh nice to haves', () => {
  const mustHave = skillFit(pro([['sql', 3]]), opp([['sql', 2], ['figma', 1]]));
  const niceOnly = skillFit(pro([['figma', 3]]), opp([['sql', 2], ['figma', 1]]));
  assert.ok(mustHave.score > niceOnly.score);
});

test('proficiency raises the score but holding the skill is most of it', () => {
  const low = skillFit(pro([['sql', 1]]), opp([['sql', 2]])).score;
  const high = skillFit(pro([['sql', 5]]), opp([['sql', 2]])).score;
  assert.ok(high > low);
  assert.ok(low > 0.5);
});

test('an hours shortfall costs points without disqualifying', () => {
  const fit = logisticsFit(pro([], { weekly_hours: 5 }), opp([], { weekly_hours: 20 }));
  assert.ok(fit.score > 0 && fit.score < 1);
  assert.equal(fit.notes.length, 1);
});

test('on site work far from home is penalised', () => {
  const near = logisticsFit(pro([]), opp([], { remote: 0 })).score;
  const far = logisticsFit(pro([], { location: 'Tokyo, Japan' }), opp([], { remote: 0 })).score;
  assert.ok(near > far);
});

test('related text scores higher than unrelated text', () => {
  const brief = localEmbedding('build an impact dashboard reporting outcomes for trustees');
  const close = localEmbedding('impact reporting and outcomes dashboards for charity boards');
  const far = localEmbedding('repair bicycles and manage a workshop rota');
  assert.ok(cosineSimilarity(brief, close) > cosineSimilarity(brief, far));
});