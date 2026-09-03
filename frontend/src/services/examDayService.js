import api from './api'
import { withFallback, asList, asTotal } from './phase1Fallback'
import { getExamDays, getExamDaySession, updateRoomStatus, markRoomAttendance } from './mock'

const examDayService = {
  getDays: async () => {
    const { result, offline } = await withFallback(() => api.get('/exam-days'), () => getExamDays())
    return { data: asList(result), total: asTotal(result), offline }
  },
  getSession: async (id) => {
    const { result, offline } = await withFallback(() => api.get(`/exam-days/${id}`), () => getExamDaySession(id))
    return { data: result, offline }
  },
  updateRoomStatus: async (examDayId, roomNumber, status) => {
    const { result, offline } = await withFallback(
      () => api.patch(`/exam-days/${examDayId}/rooms/${roomNumber}`, { status }),
      () => updateRoomStatus(examDayId, roomNumber, status),
    )
    return { data: result, offline }
  },
  markRoomAttendance: async (examDayId, roomNumber, attendanceStatus) => {
    const { result, offline } = await withFallback(
      () => api.patch(`/exam-days/${examDayId}/rooms/${roomNumber}/attendance`, { attendanceStatus }),
      () => markRoomAttendance(examDayId, roomNumber, attendanceStatus),
    )
    return { data: result, offline }
  },
}

export { examDayService }
