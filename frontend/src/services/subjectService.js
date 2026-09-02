import api from './api'

export const subjectService = {
  getAll: (params) => api.get('/subjects', { params }),
  getById: (id) => api.get(`/subjects/${id}`),
  create: (data) => api.post('/subjects', data),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  deactivate: (id) => api.patch(`/subjects/${id}/deactivate`),
}
