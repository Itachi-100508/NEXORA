import api from './api'
import { withFallback, asList, asTotal } from './phase1Fallback'
import { generateSeatingPlan, getSeatingPlans, getSeatingPlanById, deleteSeatingPlan } from './mock'

const seatingService = {
  generate: async (data) => {
    const { result, offline } = await withFallback(() => api.post('/seating/generate', data), () => generateSeatingPlan(data.classId, data.division, data.examId))
    return { data: result, offline }
  },
  getAll: async () => {
    const { result, offline } = await withFallback(() => api.get('/seating/plans'), () => getSeatingPlans())
    return { data: asList(result), total: asTotal(result), offline }
  },
  getById: async (id) => {
    const { result, offline } = await withFallback(() => api.get(`/seating/plans/${id}`), () => getSeatingPlanById(id))
    return { data: result, offline }
  },
  remove: (id) => withFallback(() => api.delete(`/seating/plans/${id}`), () => deleteSeatingPlan(id)),
}

export { seatingService }
