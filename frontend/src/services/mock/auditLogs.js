const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

const auditStore = [
  { id: 1, userId: 'admin-001', actor: 'Sarah Mitchell', role: 'admin', action: 'PUBLISHED', entity: 'Result', entityId: '71', ip: '10.20.1.45', timestamp: '2026-08-28T10:32:00', detail: 'Published SEM-3 result for Aisha Khan' },
  { id: 2, userId: 'admin-001', actor: 'Sarah Mitchell', role: 'admin', action: 'APPROVED', entity: 'Submission', entityId: '62', ip: '10.20.1.45', timestamp: '2026-08-28T10:12:00', detail: 'Approved Thermodynamics marks with note "verified"' },
  { id: 3, userId: 'teacher-011', actor: 'James Carter', role: 'teacher', action: 'SUBMITTED', entity: 'Submission', entityId: '63', ip: '10.20.1.88', timestamp: '2026-08-27T09:15:00', detail: 'Submitted Database Systems marks for review' },
  { id: 4, userId: 'admin-001', actor: 'Sarah Mitchell', role: 'admin', action: 'REJECTED', entity: 'Submission', entityId: '63', ip: '10.20.1.45', timestamp: '2026-08-26T15:40:00', detail: 'Rejected Database Systems: total mismatch' },
  { id: 5, userId: 'student-021', actor: 'Aisha Khan', role: 'student', action: 'VERIFIED', entity: 'Result', entityId: '71', ip: '10.20.1.160', timestamp: '2026-08-25T18:03:00', detail: 'Verified result via public QR link' },
  { id: 6, userId: 'teacher-012', actor: 'Priya Sharma', role: 'teacher', action: 'SUBMITTED', entity: 'Submission', entityId: '61', ip: '10.20.1.91', timestamp: '2026-08-20T10:30:00', detail: 'Submitted Embedded Systems marks for review' },
  { id: 7, userId: 'admin-001', actor: 'Sarah Mitchell', role: 'admin', action: 'ACTIVATED', entity: 'Exam', entityId: '32', ip: '10.20.1.45', timestamp: '2026-08-10T09:00:00', detail: 'Activated Mid Semester Examination - Sem 4' },
  { id: 8, userId: 'student-021', actor: 'Aisha Khan', role: 'student', action: 'REQUESTED', entity: 'Revaluation', entityId: '81', ip: '10.20.1.160', timestamp: '2026-08-05T13:22:00', detail: 'Requested revaluation for Database Systems' },
  { id: 9, userId: 'admin-001', actor: 'Sarah Mitchell', role: 'admin', action: 'GENERATED', entity: 'Report', entityId: 'RPT-102', ip: '10.20.1.45', timestamp: '2026-08-01T11:00:00', detail: 'Generated department performance report' },
  { id: 10, userId: 'admin-001', actor: 'Sarah Mitchell', role: 'admin', action: 'IMPORTED', entity: 'Student', entityId: '25', ip: '10.20.1.45', timestamp: '2026-07-30T14:20:00', detail: 'Imported 5 students from students-batch-2.csv' },
  { id: 11, userId: 'teacher-013', actor: 'Robert Lee', role: 'teacher', action: 'SUBMITTED', entity: 'Submission', entityId: '62', ip: '10.20.1.77', timestamp: '2026-02-10T09:00:00', detail: 'Submitted Thermodynamics marks for review' },
  { id: 12, userId: 'admin-001', actor: 'Sarah Mitchell', role: 'admin', action: 'LOGOUT', entity: 'Session', entityId: 's-8842', ip: '10.20.1.45', timestamp: '2026-01-15T19:05:00', detail: 'Signed out from admin console' },
]

const ACTION_OPTIONS = ['PUBLISHED', 'APPROVED', 'REJECTED', 'SUBMITTED', 'VERIFIED', 'REQUESTED', 'ACTIVATED', 'GENERATED', 'IMPORTED', 'CREATED', 'UPDATED', 'LOGOUT', 'LOGIN']

export { ACTION_OPTIONS }

export async function getAuditLogs(params = {}) {
  await delay(300)
  let data = [...auditStore]
  if (params.search) {
    const q = params.search.toLowerCase()
    data = data.filter(
      (l) => l.actor.toLowerCase().includes(q) || l.entity.toLowerCase().includes(q) || l.detail.toLowerCase().includes(q) || l.entityId.toLowerCase().includes(q),
    )
  }
  if (params.role) data = data.filter((l) => l.role === params.role)
  if (params.action) data = data.filter((l) => l.action === params.action)
  if (params.from) data = data.filter((l) => l.timestamp >= params.from)
  if (params.to) data = data.filter((l) => l.timestamp <= params.to)
  data = data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  const total = data.length
  const page = params.page || 1
  const pageSize = params.pageSize || 10
  data = data.slice((page - 1) * pageSize, page * pageSize)
  return { data, total, page, pageSize }
}