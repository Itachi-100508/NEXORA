import api from './api'

export const examService = {
  getAll: (params) => api.get('/exams', { params }),
  getById: (id) => api.get(`/exams/${id}`),
  create: (data) => api.post('/exams', data),
  update: (id, data) => api.put(`/exams/${id}`, data),
  activate: (id) => api.patch(`/exams/${id}/activate`),
  deactivate: (id) => api.patch(`/exams/${id}/deactivate`),
  assignTeachers: (id, data) => api.post(`/exams/${id}/assign`, data),
}
