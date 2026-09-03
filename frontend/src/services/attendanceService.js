import api from './api'

const attendanceService = {
  getClasses: () => api.get('/attendance/classes'),
  getDivisions: (classId) => api.get(`/attendance/classes/${classId}/divisions`),
  getStudents: (classId, division) => api.get('/attendance/students', { params: { classId, division } }),
  getRecord: (classId, division, date) => api.get('/attendance/record', { params: { classId, division, date } }),
  saveRecord: (data) => api.post('/attendance/record', data),
  getHistory: (filters) => api.get('/attendance/history', { params: filters }),
  getWeekly: (classId, division, weekOffset) => api.get('/attendance/weekly', { params: { classId, division, weekOffset } }),
  getMonthly: (classId, division, year, month) => api.get('/attendance/monthly', { params: { classId, division, year, month } }),
  getStudentSummary: (classId, division) => api.get('/attendance/student-summary', { params: { classId, division } }),
  getStudentOwn: (studentId) => api.get(`/attendance/student/${studentId}`),
  getAdminOverview: () => api.get('/attendance/admin/overview'),
  getLowAttendance: (classId, division, threshold) => api.get('/attendance/low-attendance', { params: { classId, division, threshold } }),
}

export { attendanceService }
