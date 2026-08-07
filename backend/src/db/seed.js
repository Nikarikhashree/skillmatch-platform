import { db, setOpportunitySkills, setProfessionalSkills } from './index.js';
import { indexOpportunity, indexProfessional } from '../services/matchingService.js';

const professionals = [
  {
    full_name: 'Amara Okonkwo', email: 'amara.okonkwo@example.com',
    headline: 'Data analyst turned impact measurement lead',
    bio: 'Fifteen years in analytics, the last six spent building monitoring and evaluation frameworks for charities. Comfortable owning the whole chain from messy intake spreadsheets to a board level dashboard.',
    location: 'Manchester, UK', years_experience: 15, weekly_hours: 12, remote_ok: 1,
    skills: [['data analysis', 5], ['monitoring and evaluation', 5], ['power bi', 4], ['sql', 4], ['excel', 5], ['stakeholder management', 4]]
  },
  {
    full_name: 'Daniel Cheong', email: 'daniel.cheong@example.com',
    headline: 'Full stack engineer, twelve years shipping web products',
    bio: 'React and Node for most of the last decade, plus enough AWS to keep a small product alive without a platform team. Mentors junior developers and likes short, well scoped builds.',
    location: 'Singapore', years_experience: 12, weekly_hours: 15, remote_ok: 1,
    skills: [['react', 5], ['node.js', 5], ['typescript', 4], ['postgresql', 4], ['aws', 3], ['rest api', 5]]
  },
  {
    full_name: 'Priya Raman', email: 'priya.raman@example.com',
    headline: 'Product designer focused on accessible public services',
    bio: 'Designs onboarding flows and forms for services used by people in crisis. Runs research with low digital confidence users and writes the interface copy as well as drawing the screens.',
    location: 'Bristol, UK', years_experience: 9, weekly_hours: 10, remote_ok: 1,
    skills: [['ux research', 5], ['ui design', 5], ['figma', 5], ['accessibility', 5], ['content strategy', 3]]
  },
  {
    full_name: 'Tomas Lindqvist', email: 'tomas.lindqvist@example.com',
    headline: 'Finance director, small business and charity turnarounds',
    bio: 'Built finance functions from nothing at three organisations. Grant reporting, cashflow forecasting, and the unglamorous work of getting bookkeeping straight before an audit.',
    location: 'Stockholm, Sweden', years_experience: 22, weekly_hours: 8, remote_ok: 1,
    skills: [['financial modelling', 5], ['bookkeeping', 4], ['grant writing', 3], ['excel', 5], ['procurement', 3]]
  },
  {
    full_name: 'Grace Mwangi', email: 'grace.mwangi@example.com',
    headline: 'Fundraising and partnerships lead',
    bio: 'Raised eight figures across trusts, corporate partnerships and individual giving. Writes bids that operations teams can actually deliver against.',
    location: 'Nairobi, Kenya', years_experience: 14, weekly_hours: 10, remote_ok: 1,
    skills: [['fundraising', 5], ['grant writing', 5], ['partnerships', 4], ['crm', 3], ['public speaking', 4]]
  },
  {
    full_name: 'Ben Alvarez', email: 'ben.alvarez@example.com',
    headline: 'Marketing strategist for early stage social ventures',
    bio: 'Ten years running lean marketing teams. Positioning, launch plans and the SEO work that keeps traffic coming after the launch noise fades.',
    location: 'Madrid, Spain', years_experience: 10, weekly_hours: 14, remote_ok: 1,
    skills: [['marketing strategy', 5], ['seo', 4], ['content strategy', 4], ['social media', 4], ['email marketing', 3]]
  },
  {
    full_name: 'Rachel Osei', email: 'rachel.osei@example.com',
    headline: 'Operations manager, volunteer programmes at scale',
    bio: 'Ran a 400 person volunteer programme across nine sites. Rotas, safeguarding, training design and the tedious process documentation that makes handover possible.',
    location: 'London, UK', years_experience: 11, weekly_hours: 16, remote_ok: 0,
    skills: [['volunteer management', 5], ['operations', 5], ['safeguarding', 4], ['training and facilitation', 4], ['project management', 4]]
  },
  {
    full_name: 'Kenji Watanabe', email: 'kenji.watanabe@example.com',
    headline: 'ML engineer working on applied recommendation systems',
    bio: 'Builds retrieval and ranking systems in Python. Recently moved from ad tech into applied work with non profits, mostly semantic search over document collections.',
    location: 'Tokyo, Japan', years_experience: 8, weekly_hours: 12, remote_ok: 1,
    skills: [['python', 5], ['machine learning', 5], ['data analysis', 4], ['sql', 4], ['docker', 3]]
  }
];

const opportunities = [
  {
    company: { name: 'Riverbank Youth Trust', sector: 'Youth services', location: 'Leeds, UK', social: 1 },
    title: 'Build an impact dashboard for the trustee board',
    description: 'We collect attendance, referral and outcome data across four programmes and it currently lives in six spreadsheets. We need someone to design the measurement framework, agree the handful of numbers that matter, and stand up a dashboard the board can read without a briefing.',
    engagement_type: 'project', duration_weeks: 10, weekly_hours: 10, remote: 1, location: 'Leeds, UK',
    min_experience: 6, budget_band: 'GBP 6k to 9k',
    skills: [['monitoring and evaluation', 2], ['data analysis', 2], ['power bi', 1.5], ['stakeholder management', 1]]
  },
  {
    company: { name: 'Loamwork Collective', sector: 'Sustainable agriculture', location: 'Bristol, UK', social: 1 },
    title: 'Rebuild the grower onboarding portal',
    description: 'Small growers sign up through a form that loses a third of them halfway. We want a React front end on top of our existing Node API, with a saved progress step and a much shorter first screen.',
    engagement_type: 'project', duration_weeks: 8, weekly_hours: 15, remote: 1, location: 'Remote',
    min_experience: 5, budget_band: 'GBP 8k to 12k',
    skills: [['react', 2], ['node.js', 2], ['rest api', 1.5], ['ux research', 1]]
  },
  {
    company: { name: 'Northgate Care Cooperative', sector: 'Social care', location: 'Newcastle, UK', social: 1 },
    title: 'Redesign the referral form for carers',
    description: 'Our referral form is eleven pages and most of our users fill it in on a phone, often in a hurry, sometimes on behalf of someone else. We want a designer to run research with carers and deliver an accessible redesign we can build in house.',
    engagement_type: 'project', duration_weeks: 6, weekly_hours: 10, remote: 1, location: 'Newcastle, UK',
    min_experience: 5, budget_band: 'GBP 5k to 7k',
    skills: [['ux research', 2], ['accessibility', 2], ['figma', 1.5], ['ui design', 1.5], ['content strategy', 1]]
  },
  {
    company: { name: 'Harbour Foods', sector: 'Food manufacturing', location: 'Aberdeen, UK', social: 0 },
    title: 'Finance function clean up before first audit',
    description: 'Twenty person manufacturer heading into our first statutory audit. Bookkeeping is behind, stock valuation is guesswork, and we need a cashflow model the bank will accept.',
    engagement_type: 'part-time', duration_weeks: 12, weekly_hours: 8, remote: 0, location: 'Aberdeen, UK',
    min_experience: 10, budget_band: 'GBP 10k to 14k',
    skills: [['bookkeeping', 2], ['financial modelling', 2], ['excel', 1.5], ['procurement', 1]]
  },
  {
    company: { name: 'Second Thread', sector: 'Circular economy retail', location: 'London, UK', social: 1 },
    title: 'Growth marketing plan for a repair service launch',
    description: 'We are launching a clothing repair service alongside our resale shop. We need positioning, a launch plan for the first quarter, and an SEO structure that does not depend on us posting daily.',
    engagement_type: 'project', duration_weeks: 8, weekly_hours: 12, remote: 1, location: 'Remote',
    min_experience: 6, budget_band: 'GBP 6k to 8k',
    skills: [['marketing strategy', 2], ['seo', 1.5], ['content strategy', 1.5], ['social media', 1]]
  },
  {
    company: { name: 'Openfield Learning', sector: 'Education technology', location: 'Dublin, Ireland', social: 0 },
    title: 'Semantic search across our lesson library',
    description: 'Six thousand lesson plans, keyword search only, teachers cannot find anything unless they know the exact title. We want retrieval that understands intent, plus an honest evaluation of how much better it actually is.',
    engagement_type: 'project', duration_weeks: 10, weekly_hours: 12, remote: 1, location: 'Remote',
    min_experience: 5, budget_band: 'EUR 9k to 13k',
    skills: [['python', 2], ['machine learning', 2], ['data analysis', 1], ['docker', 1]]
  },
  {
    company: { name: 'Riverbank Youth Trust', sector: 'Youth services', location: 'Leeds, UK', social: 1 },
    title: 'Restructure the volunteer programme across three sites',
    description: 'Volunteer numbers doubled and our processes did not keep up. We need rotas, a training pathway, and safeguarding paperwork that survives someone leaving.',
    engagement_type: 'part-time', duration_weeks: 14, weekly_hours: 16, remote: 0, location: 'Leeds, UK',
    min_experience: 8, budget_band: 'GBP 9k to 12k',
    skills: [['volunteer management', 2], ['operations', 1.5], ['safeguarding', 1.5], ['training and facilitation', 1]]
  },
  {
    company: { name: 'Kindling Foundation', sector: 'Grant making', location: 'Nairobi, Kenya', social: 1 },
    title: 'Trust and foundation fundraising strategy',
    description: 'We fund community energy projects and want to move from one large funder to a spread of trusts. Needed: a prospect list, a case for support, and two bids written with us rather than for us.',
    engagement_type: 'project', duration_weeks: 12, weekly_hours: 10, remote: 1, location: 'Remote',
    min_experience: 8, budget_band: 'USD 8k to 11k',
    skills: [['fundraising', 2], ['grant writing', 2], ['partnerships', 1.5], ['crm', 0.5]]
  }
];

const volunteers = [
  ['Sofia Marchetti', 'sofia.m@example.com', 'copywriting, social media', 20, 'Digital skills'],
  ['Owen Pryce', 'owen.pryce@example.com', 'excel, bookkeeping', 12, 'Money advice'],
  ['Lena Fischer', 'lena.fischer@example.com', 'training and facilitation', 30, 'Employability'],
  ['Hassan Idris', 'hassan.idris@example.com', 'python, data analysis', 16, 'Digital skills']
];

const beneficiaries = [
  ['RB-2401', '18-24', 'Employability', 'Job centre', 'CV support, interview practice'],
  ['RB-2402', '25-34', 'Digital skills', 'Self referral', 'Basic computer confidence'],
  ['RB-2403', '35-44', 'Money advice', 'Partner charity', 'Budgeting, debt letters'],
  ['RB-2404', '18-24', 'Employability', 'School referral', 'First job applications'],
  ['RB-2405', '45-54', 'Digital skills', 'Community centre', 'Online forms and banking'],
  ['RB-2406', '25-34', 'Employability', 'Self referral', 'Career change planning']
];

const impactEvents = [
  ['hours_contributed', 240, 'Employability', 'Q1 volunteer hours'],
  ['hours_contributed', 180, 'Digital skills', 'Q1 volunteer hours'],
  ['workshop_delivered', 12, 'Employability', 'Interview practice sessions'],
  ['workshop_delivered', 8, 'Digital skills', 'Device confidence sessions'],
  ['outcome_recorded', 19, 'Employability', 'Moved into work or training']
];

const wipe = db.transaction(() => {
  for (const table of ['matches', 'applications', 'opportunity_skills', 'professional_skills',
    'opportunities', 'companies', 'professionals', 'skills', 'volunteers', 'beneficiaries', 'impact_events']) {
    db.prepare(`DELETE FROM ${table}`).run();
  }
  db.prepare("DELETE FROM sqlite_sequence WHERE name NOT NULL").run();
});

wipe();

for (const person of professionals) {
  const info = db.prepare(
    `INSERT INTO professionals (full_name, email, headline, bio, location, years_experience, weekly_hours, remote_ok, resume_text)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(person.full_name, person.email, person.headline, person.bio, person.location,
    person.years_experience, person.weekly_hours, person.remote_ok, person.bio);
  setProfessionalSkills(Number(info.lastInsertRowid), person.skills.map(([name, proficiency]) => ({ name, proficiency })));
}

for (const role of opportunities) {
  db.prepare('INSERT OR IGNORE INTO companies (name, sector, location, is_social_enterprise) VALUES (?, ?, ?, ?)')
    .run(role.company.name, role.company.sector, role.company.location, role.company.social);
  const company = db.prepare('SELECT id FROM companies WHERE name = ?').get(role.company.name);

  const info = db.prepare(
    `INSERT INTO opportunities (company_id, title, description, engagement_type, duration_weeks, weekly_hours,
       remote, location, min_experience, budget_band, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')`
  ).run(company.id, role.title, role.description, role.engagement_type, role.duration_weeks,
    role.weekly_hours, role.remote, role.location, role.min_experience, role.budget_band);

  setOpportunitySkills(Number(info.lastInsertRowid), role.skills.map(([name, weight]) => ({ name, weight })));
}

for (const [name, email, skills, hours, programme] of volunteers) {
  db.prepare('INSERT INTO volunteers (full_name, email, skills_text, hours_pledged, programme) VALUES (?, ?, ?, ?, ?)')
    .run(name, email, skills, hours, programme);
}

for (const [code, age, programme, referral, needs] of beneficiaries) {
  db.prepare(
    `INSERT INTO beneficiaries (reference_code, age_band, programme, referral_source, support_needs, consent_given)
     VALUES (?, ?, ?, ?, ?, 1)`
  ).run(code, age, programme, referral, needs);
}

for (const [type, value, programme, note] of impactEvents) {
  db.prepare('INSERT INTO impact_events (event_type, value, programme, note) VALUES (?, ?, ?, ?)')
    .run(type, value, programme, note);
}

db.prepare(
  `INSERT INTO applications (professional_id, opportunity_id, status, hours_logged)
   VALUES (1, 1, 'placed', 96), (3, 3, 'shortlisted', 0), (2, 2, 'applied', 0), (5, 8, 'placed', 64)`
).run();

for (const row of db.prepare('SELECT id FROM professionals').all()) await indexProfessional(row.id);
for (const row of db.prepare('SELECT id FROM opportunities').all()) await indexOpportunity(row.id);

console.log(`Seeded ${professionals.length} professionals, ${opportunities.length} projects, ` +
  `${volunteers.length} volunteers and ${beneficiaries.length} beneficiary records.`);
