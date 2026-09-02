import api from './api'

export const aiService = {
  getResponse: (question, role) => api.post('/ai/assist', { question, role }),
  getSuggestedPrompts: (role) => api.get('/ai/suggestions', { params: { role } }),
}