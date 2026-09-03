import api from './api'
import { withFallback, asList, asTotal } from './phase1Fallback'
import {
  getInvigilationRoster,
  addInvigilationDuty,
  removeInvigilationDuty,
  getTeacherInvigilationDuties,
  getInvigilationStats,
} from './mock'

const invigilatorService = {
  getRoster: async () => {
    const { result, offline } = await withFallback(() => api.get('/invigilation/roster'), () => getInvigilationRoster())
    return { data: asList(result), total: asTotal(result), offline }
  },
  addDuty: (data) => withFallback(() => api.post('/invigilation/duties', data), () => addInvigilationDuty(data)),
  removeDuty: (id) => withFallback(() => api.delete(`/invigilation/duties/${id}`), () => removeInvigilationDuty(id)),
  getTeacherDuties: async (teacherId) => {
    const { result, offline } = await withFallback(() => api.get(`/invigilation/teachers/${teacherId}/duties`), () => getTeacherInvigilationDuties(teacherId))
    return { data: asList(result), offline }
  },
  getStats: async () => {
    const { result, offline } = await withFallback(() => api.get('/invigilation/stats'), () => getInvigilationStats())
    return { data: result, offline }
  },
}

export { invigilatorService }
