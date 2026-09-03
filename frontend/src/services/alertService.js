import api from './api'
import { withFallback, asList, asTotal } from './phase1Fallback'
import { getAlerts, getUnreadAlertCount, markAlertRead, markAllAlertsRead, dismissAlert } from './mock'

const alertService = {
  getAll: async () => {
    const { result, offline } = await withFallback(() => api.get('/alerts'), () => getAlerts())
    return { data: asList(result), total: asTotal(result), offline }
  },
  getUnreadCount: async () => {
    const { result, offline } = await withFallback(() => api.get('/alerts/unread-count'), () => getUnreadAlertCount())
    return { data: result, offline }
  },
  markRead: (id) => withFallback(() => api.post(`/alerts/${id}/read`), () => markAlertRead(id)),
  markAllRead: () => withFallback(() => api.post('/alerts/read-all'), () => markAllAlertsRead()),
  dismiss: (id) => withFallback(() => api.delete(`/alerts/${id}`), () => dismissAlert(id)),
}

export { alertService }
