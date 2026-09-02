import api from './api'

export const marksService = {
  getSubmissions: () => api.get('/marks/submissions'),
  saveDraft: (assignmentId, marks) => api.post(`/marks/${assignmentId}/draft`, { marks }),
  submit: (assignmentId, marks) => api.post(`/marks/${assignmentId}/submit`, { marks }),
  review: (resultId, decision, note) => api.post(`/results/${resultId}/review`, { decision, note }),
  publish: (resultId) => api.post(`/results/${resultId}/publish`),
}