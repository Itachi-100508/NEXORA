import api from './api'

export const studentService = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  deactivate: (id) => api.patch(`/students/${id}/deactivate`),
  getResults: (id) => api.get(`/students/${id}/results`),
  getResultById: (resultId) => api.get(`/students/results/${resultId}`),
  getMarksheet: (resultId) => api.get(`/students/results/${resultId}/marksheet`),
}
