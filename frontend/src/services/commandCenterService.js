import api from './api'
import { withFallback } from './phase1Fallback'
import {
  getAlerts,
  getAnomalies,
  getExamCalendarEvents,
  getSeatingPlans,
  getInvigilationRoster,
  getUnreadAlertCount,
  getAnomalyStats,
  calendarExams,
} from './mock'

const commandCenterService = {
  getOverview: async () => {
    const { result, offline } = await withFallback(
      () => api.get('/command-center/overview'),
      async () => {
        const [alerts, anomalies, events, seating, roster, anomalyStats, unread] = await Promise.all([
          getAlerts(),
          getAnomalies(),
          getExamCalendarEvents(),
          getSeatingPlans(),
          getInvigilationRoster(),
          getAnomalyStats(),
          getUnreadAlertCount(),
        ])
        const upcoming = events.data.filter((e) => e.status === 'SCHEDULED').length
        const nextEvent =
          events.data
            .filter((e) => e.status === 'SCHEDULED' || e.status === 'CONFIRMED')
            .sort((a, b) => (a.date || '').localeCompare(b.date || ''))[0] || null
        return {
          exams: {
            total: calendarExams.length,
            active: calendarExams.filter((e) => e.status === 'ACTIVE').length,
            upcoming: calendarExams.filter((e) => e.status === 'UPCOMING').length,
            closed: calendarExams.filter((e) => e.status === 'CLOSED').length,
          },
          alerts: { list: alerts.data, unread },
          anomalies: { list: anomalies.data, stats: anomalyStats },
          calendar: { events: events.data, upcomingEvents: upcoming, nextEvent },
          seating: { plans: seating.data },
          invigilation: { roster: roster.data },
          health: {
            eventsScheduled: upcoming,
            plansReady: seating.data.length,
            assignedDuties: roster.data.length,
            highPriorityAnomalies: anomalyStats.bySeverity.high,
          },
        }
      },
    )
    return { data: result, offline }
  },
}

export { commandCenterService }
