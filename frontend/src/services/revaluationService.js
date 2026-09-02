import api from './api'

export const revaluationService = {
  getRequests: () => api.get('/revaluations'),
  getMine: () => api.get('/revaluations/my'),
  request: (payload) => api.post('/revaluations', payload),
  decide: (id, decision, note) => api.post(`/revaluations/${id}/decide`, { decision, note }),
}