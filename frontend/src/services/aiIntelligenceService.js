import api from './api'
import { withFallback } from './phase1Fallback'
import {
  getIntelligenceAnswer,
  getIntelligencePrompts,
  getUnreadAlertCount,
  getAnomalyStats,
  getExamCalendarEvents,
  getInvigilationStats,
  getIncidentStats,
  getWorkloadSummary,
} from './mock'

const aiIntelligenceService = {
  ask: async (question, role, context) => {
    let res
    try {
      res = await withFallback(
        () => api.post('/ai/intelligence', { question, role, context }),
        async () => {
          const answer = await getIntelligenceAnswer(question, role)
          const live = await buildLiveContext(role)
          return { answer, live }
        },
      )
    } catch (e) {
      const answer = await getIntelligenceAnswer(question, role)
      res = { result: { answer, live: null }, offline: true }
    }
    return { data: res.result, offline: res.offline }
  },
  prompts: async (role) => {
    const { result, offline } = await withFallback(() => api.get('/ai/intelligence/prompts', { params: { role } }), () => getIntelligencePrompts(role))
    return { data: asPrompts(result), offline }
  },
}

function asPrompts(result) {
  if (Array.isArray(result)) return result
  if (Array.isArray(result?.data)) return result.data
  return []
}

async function buildLiveContext(role) {
  if (role !== 'admin') return null
  const alerts = await getUnreadAlertCount()
  const anomaly = await getAnomalyStats()
  const events = await getExamCalendarEvents()
  const invig = await getInvigilationStats()
  const incident = await getIncidentStats().catch(() => null)
  const workload = await getWorkloadSummary().catch(() => null)
  return {
    unreadAlerts: alerts,
    anomalies: anomaly.unresolved + anomaly.reviewing + anomaly.flagged,
    upcomingEvents: events.data.filter((e) => e.status === 'SCHEDULED').length,
    invigilationDuties: invig.totalDuties,
    openIncidents: incident ? incident.open : 0,
    totalIncidents: incident ? incident.total : 0,
    avgTeacherUtilization: workload?.data?.avgUtilization ?? 0,
  }
}

export { aiIntelligenceService }
