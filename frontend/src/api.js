const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    headers: options.body ? { 'Content-Type': 'application/json' } : {},
    ...options
  });

  if (!response.ok) {
    let message = `Request failed with ${response.status}`;
    try {
      const body = await response.json();
      if (body.error) message = body.error;
    } catch { /* keep the status message */ }
    throw new Error(message);
  }

  return response.status === 204 ? null : response.json();
}

const post = (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) });

export const api = {
  health: () => request('/health'),

  listProfessionals: () => request('/professionals'),
  getProfessional: (id) => request(`/professionals/${id}`),
  createProfessional: (data) => post('/professionals', data),
  parseResume: (text) => post('/professionals/parse-resume', { text }),
  matchesForProfessional: (id, limit = 5) => request(`/professionals/${id}/matches?limit=${limit}`),

  listOpportunities: (params = {}) => {
    const query = new URLSearchParams({ status: 'open', ...params }).toString();
    return request(`/companies/opportunities/all?${query}`);
  },
  createOpportunity: (data) => post('/companies/opportunities', data),
  matchesForOpportunity: (id, limit = 5) => request(`/matches/opportunity/${id}?limit=${limit}`),
  scorePair: (professionalId, opportunityId) => request(`/matches/pair/${professionalId}/${opportunityId}`),
  apply: (professionalId, opportunityId) =>
    post('/matches/applications', { professional_id: professionalId, opportunity_id: opportunityId }),

  analytics: () => request('/analytics'),
  addVolunteer: (data) => post('/analytics/volunteers', data),
  addBeneficiary: (data) => post('/analytics/beneficiaries', data),

  chat: (message, history) => post('/chatbot', { message, history })
};
