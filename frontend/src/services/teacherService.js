import api from './api'

export const teacherService = {
  getAll: (params) => api.get('/teachers', { params }),
  getById: (id) => api.get(`/teachers/${id}`),
  create: (data) => api.post('/teachers', data),
  update: (id, data) => api.put(`/teachers/${id}`, data),
  deactivate: (id) => api.patch(`/teachers/${id}/deactivate`),
  getAssignments: (params) => api.get('/teachers/assignments', { params }),
  getAssignmentById: (id) => api.get(`/teachers/assignments/${id}`),
  getAssignmentStudents: (assignmentId) => api.get(`/teachers/assignments/${assignmentId}/students`),
  saveMarks: (assignmentId, data) => api.post(`/teachers/assignments/${assignmentId}/marks`, data),
  submitMarks: (assignmentId, data) => api.post(`/teachers/assignments/${assignmentId}/submit`, data),
  getSubmissions: (params) => api.get('/teachers/submissions', { params }),
  getDashboard: () => api.get('/teachers/dashboard'),
}
