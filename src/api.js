const API_BASE = '/api';

async function request(url, options = {}) {
  const token = localStorage.getItem('fitcoach_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export const api = {
  // Auth
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),

  // Onboarding
  saveProfile: (data) => request('/onboarding/profile', { method: 'POST', body: JSON.stringify(data) }),
  saveHealth: (data) => request('/onboarding/health', { method: 'POST', body: JSON.stringify(data) }),
  saveExperience: (data) => request('/onboarding/experience', { method: 'POST', body: JSON.stringify(data) }),
  savePreferences: (data) => request('/onboarding/preferences', { method: 'POST', body: JSON.stringify(data) }),
  saveGoals: (data) => request('/onboarding/goals', { method: 'POST', body: JSON.stringify(data) }),
  getOnboardingData: () => request('/onboarding/data'),
  updateProfile: (data) => request('/onboarding/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // Workout
  generatePlan: () => request('/workout/generate', { method: 'POST' }),
  getActivePlan: () => request('/workout/active'),
  getPlanHistory: () => request('/workout/history'),
  startSession: (data) => request('/workout/session/start', { method: 'POST', body: JSON.stringify(data) }),
  recordSet: (data) => request('/workout/session/set', { method: 'POST', body: JSON.stringify(data) }),
  completeSession: (data) => request('/workout/session/complete', { method: 'POST', body: JSON.stringify(data) }),
  getSessions: () => request('/workout/sessions'),
  getSessionDetail: (id) => request(`/workout/session/${id}`),
  getWorkoutStats: () => request('/workout/stats'),

  // Progress
  addMeasurement: (data) => request('/progress', { method: 'POST', body: JSON.stringify(data) }),
  getMeasurements: () => request('/progress'),
  getProgressSummary: () => request('/progress/summary'),
  deleteMeasurement: (id) => request(`/progress/${id}`, { method: 'DELETE' }),

  // AI
  chatWithAI: (message) => request('/ai/chat', { method: 'POST', body: JSON.stringify({ message }) }),
  getAIHistory: () => request('/ai/history'),
  clearAIHistory: () => request('/ai/history', { method: 'DELETE' }),
  generateNutrition: (data) => request('/ai/nutrition', { method: 'POST', body: JSON.stringify(data) }),
  getNutrition: () => request('/ai/nutrition'),

  // Account
  deleteAccount: () => request('/auth/account', { method: 'DELETE' }),
};
