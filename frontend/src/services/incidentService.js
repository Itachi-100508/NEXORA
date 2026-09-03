import api from './api'
import { withFallback, asList, asTotal } from './phase1Fallback'
import {
  getIncidents,
  getIncidentById,
  getIncidentStats,
  createIncident,
  updateIncident,
  decideIncident,
} from './mock'

const incidentService = {
  getAll: async (filters = {}) => {
    const { result, offline } = await withFallback(() => api.get('/incidents', { params: filters }), () => getIncidents(filters))
    return { data: asList(result), total: asTotal(result), offline }
  },
  getById: async (id) => {
    const { result, offline } = await withFallback(() => api.get(`/incidents/${id}`), () => getIncidentById(id))
    return { data: result, offline }
  },
  getStats: async () => {
    const { result, offline } = await withFallback(() => api.get('/incidents/stats'), () => getIncidentStats())
    return { data: result, offline }
  },
  create: async (payload) => {
    const { result, offline } = await withFallback(() => api.post('/incidents', payload), () => createIncident(payload))
    return { data: result, offline }
  },
  update: async (id, patch) => {
    const { result, offline } = await withFallback(() => api.patch(`/incidents/${id}`, patch), () => updateIncident(id, patch))
    return { data: result, offline }
  },
  decide: async (id, decision, note) => {
    const { result, offline } = await withFallback(() => api.post(`/incidents/${id}/decide`, { decision, note }), () => decideIncident(id, decision, note))
    return { data: result, offline }
  },
}

export { incidentService }
