import api from './api'

export const departmentService = {
  getAll: (params) => api.get('/departments', { params }),
  getById: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  deactivate: (id) => api.patch(`/departments/${id}/deactivate`),
}
