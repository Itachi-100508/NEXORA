import api from './api'

export const analyticsService = {
  getOverview: () => api.get('/analytics/overview'),
  getPassFail: () => api.get('/analytics/pass-fail'),
  getSubjectPerformance: () => api.get('/analytics/subject-performance'),
  getClassPerformance: () => api.get('/analytics/class-performance'),
  getDepartmentComparison: () => api.get('/analytics/department-comparison'),
  getSemesterComparison: () => api.get('/analytics/semester-comparison'),
  getGradeDistribution: () => api.get('/analytics/grade-distribution'),
  getPerformanceTrend: () => api.get('/analytics/performance-trend'),
}