import api from './api'

export const studentService = {
  getAll: (params) => api.get('/students/', { params }),
  getById: (id) => api.get(`/students/${id}/`),
  create: (data) => api.post('/students/', data),
  update: (id, data) => api.patch(`/students/${id}/`, data),
  activate: (id) => api.post(`/students/${id}/activate/`),
  deactivate: (id) => api.delete(`/students/${id}/`),
  permanentDelete: (id) => api.delete(`/students/${id}/permanent-delete/`),
  getResults: (id) => api.get(`/students/${id}/results/`),
  getResultById: (resultId) => api.get(`/students/results/${resultId}/`),
  getMarksheet: (resultId) => api.get(`/students/results/${resultId}/marksheet/`),
}
