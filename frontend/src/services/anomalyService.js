import api from './api'
import { withFallback, asList, asTotal } from './phase1Fallback'
import { getAnomalies, resolveAnomaly, getAnomalyStats } from './mock'

const anomalyService = {
  getAll: async () => {
    const { result, offline } = await withFallback(() => api.get('/anomalies'), () => getAnomalies())
    return { data: asList(result), total: asTotal(result), offline }
  },
  getStats: async () => {
    const { result, offline } = await withFallback(() => api.get('/anomalies/stats'), () => getAnomalyStats())
    return { data: result, offline }
  },
  resolve: (id, note) => withFallback(() => api.post(`/anomalies/${id}/resolve`, { note }), () => resolveAnomaly(id, note)),
}

export { anomalyService }
