import api from './api'
import { withFallback, asList, asTotal } from './phase1Fallback'
import { getStudentJourney, getClassAverageComparison, getAttendancePerformanceCorrelation } from './mock'

const studentInsightService = {
  getJourney: async (studentId, studentName) => {
    const { result, offline } = await withFallback(() => api.get(`/students/${studentId}/journey`), () => getStudentJourney(studentId, studentName))
    return { data: result.data ?? result, offline }
  },
  getClassComparison: async (studentId) => {
    const { result, offline } = await withFallback(() => api.get(`/students/${studentId}/class-comparison`), () => getClassAverageComparison())
    return { data: asList(result), total: asTotal(result), offline }
  },
  getCorrelation: async (studentId) => {
    const { result, offline } = await withFallback(() => api.get(`/students/${studentId}/correlation`), () => getAttendancePerformanceCorrelation(studentId))
    return { data: asList(result), total: asTotal(result), offline }
  },
}

export { studentInsightService }
