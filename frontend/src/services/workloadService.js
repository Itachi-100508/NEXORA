import api from './api'
import { withFallback, asList, asTotal } from './phase1Fallback'
import { getTeacherWorkload, getAllTeacherWorkload, getWorkloadSummary } from './mock'

const workloadService = {
  getMine: async (teacherId) => {
    const { result, offline } = await withFallback(() => api.get(`/teachers/${teacherId}/workload`), () => getTeacherWorkload(teacherId))
    return { data: result.data ?? result, offline }
  },
  getAll: async () => {
    const { result, offline } = await withFallback(() => api.get('/teachers/workload'), () => getAllTeacherWorkload())
    return { data: asList(result), total: asTotal(result), offline }
  },
  getSummary: async () => {
    const { result, offline } = await withFallback(() => api.get('/teachers/workload/summary'), () => getWorkloadSummary())
    return { data: result.data ?? result, offline }
  },
}

export { workloadService }
