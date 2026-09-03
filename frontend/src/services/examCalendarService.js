import api from './api'
import { withFallback, asList, asTotal } from './phase1Fallback'
import {
  getExamCalendarEvents,
  addExamCalendarEvent,
  updateExamCalendarEvent,
  deleteExamCalendarEvent,
} from './mock'

const examCalendarService = {
  getAll: async () => {
    const { result, offline } = await withFallback(() => api.get('/exam-calendar/events'), () => getExamCalendarEvents())
    return { data: asList(result), total: asTotal(result), offline }
  },
  create: (data) => withFallback(() => api.post('/exam-calendar/events', data), () => addExamCalendarEvent(data)),
  update: (id, data) => withFallback(() => api.put(`/exam-calendar/events/${id}`, data), () => updateExamCalendarEvent(id, data)),
  remove: (id) => withFallback(() => api.delete(`/exam-calendar/events/${id}`), () => deleteExamCalendarEvent(id)),
}

export { examCalendarService }
