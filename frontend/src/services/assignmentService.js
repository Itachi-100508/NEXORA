import api from './api'

export const assignmentService = {
  getAssignments: (params) => api.get('/assignments', { params }),
  getAssignmentById: (id) => api.get(`/assignments/${id}`),
  getAssignmentStudents: (assignmentId) => api.get(`/assignments/${assignmentId}/students`),
  createAssignment: (payload) => api.post('/assignments', payload),
  updateAssignment: (id, payload) => api.put(`/assignments/${id}`, payload),
}