import api from './api'

export const reportService = {
  getStudentDistribution: () => api.get('/reports/student-distribution'),
  getPerformance: () => api.get('/reports/performance'),
  getSubjectPerformance: () => api.get('/reports/subject-performance'),
  getActivity: () => api.get('/reports/activity'),
}
