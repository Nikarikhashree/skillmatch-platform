import { db } from '../db/index.js';
import { indexOpportunity, indexProfessional } from '../services/matchingService.js';

/** Rebuild every stored vector, for example after switching embedding provider. */
const professionals = db.prepare('SELECT id FROM professionals').all();
const opportunities = db.prepare('SELECT id FROM opportunities').all();

for (const row of professionals) await indexProfessional(row.id);
for (const row of opportunities) await indexOpportunity(row.id);

console.log(`Reindexed ${professionals.length} professionals and ${opportunities.length} projects.`);
