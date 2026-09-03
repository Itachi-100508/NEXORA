import { delay, readStore, writeStore } from './phase1Storage'
import { logAuditEntry } from './auditLogs'

const INCIDENT_KEY = 'examora_incidents'

const SEED_INCIDENTS = [
  {
    id: 6001,
    type: 'Malpractice',
    severity: 'Critical',
    student: 'Riya Patil',
    rollNumber: 'CLS2-B-041',
    exam: 'Database Systems',
    examDayId: 5001,
    room: '204',
    description: 'Student found with handwritten notes concealed during the theory paper.',
    timestamp: '2026-09-14T10:32:00',
    status: 'OPEN',
    evidence: 'incident-6001.pdf',
    reviewer: null,
    remarks: [],
    reportedBy: 'Prof. Priya Sharma',
    timeline: [
      { at: '2026-09-14T10:32:00', label: 'Reported', detail: 'Incident submitted by invigilator', by: 'Prof. Priya Sharma' },
    ],
  },
  {
    id: 6002,
    type: 'Late Arrival',
    severity: 'Low',
    student: 'Arjun Desai',
    rollNumber: 'CS-2023-011',
    exam: 'Data Structures',
    examDayId: 5002,
    room: '105',
    description: 'Student arrived 25 minutes after the examination started.',
    timestamp: '2026-09-14T10:55:00',
    status: 'UNDER_REVIEW',
    evidence: null,
    reviewer: 'Sarah Mitchell',
    remarks: [{ at: '2026-09-14T11:05:00', by: 'Sarah Mitchell', text: 'Allowed to continue; verifying eligibility rules.' }],
    reportedBy: 'Prof. James Carter',
    timeline: [
      { at: '2026-09-14T10:55:00', label: 'Reported', detail: 'Incident submitted by invigilator', by: 'Prof. James Carter' },
      { at: '2026-09-14T11:05:00', label: 'Reviewed', detail: 'Assigned reviewer', by: 'Sarah Mitchell' },
    ],
  },
  {
    id: 6003,
    type: 'Technical Issue',
    severity: 'High',
    student: '—',
    rollNumber: '—',
    exam: 'Database Systems',
    examDayId: 5001,
    room: '208',
    description: 'Power fluctuation interrupted the computer-based assessment for 4 minutes.',
    timestamp: '2026-09-14T11:12:00',
    status: 'OPEN',
    evidence: null,
    reviewer: null,
    remarks: [],
    reportedBy: 'Prof. Sunita Rao',
    timeline: [
      { at: '2026-09-14T11:12:00', label: 'Reported', detail: 'Incident submitted by invigilator', by: 'Prof. Sunita Rao' },
    ],
  },
  {
    id: 6004,
    type: 'Medical Issue',
    severity: 'High',
    student: 'Emily Watson',
    rollNumber: 'CS-2023-003',
    exam: 'Thermodynamics',
    examDayId: 5003,
    room: '301',
    description: 'Student reported severe discomfort and was escorted to the health centre.',
    timestamp: '2026-09-16T09:20:00',
    status: 'RESOLVED',
    evidence: null,
    reviewer: 'Sarah Mitchell',
    remarks: [{ at: '2026-09-16T12:00:00', by: 'Sarah Mitchell', text: 'Medical certificate received; supplementary consideration granted.' }],
    reportedBy: 'Prof. Karthik Menon',
    timeline: [
      { at: '2026-09-16T09:20:00', label: 'Reported', detail: 'Incident submitted by invigilator', by: 'Prof. Karthik Menon' },
      { at: '2026-09-16T09:35:00', label: 'Reviewed', detail: 'Escalated to coordinator', by: 'Sarah Mitchell' },
      { at: '2026-09-16T12:00:00', label: 'Resolved', detail: 'Medical certificate verified', by: 'Sarah Mitchell' },
    ],
  },
  {
    id: 6005,
    type: 'Attendance Issue',
    severity: 'Medium',
    student: 'Sofia Rodriguez',
    rollNumber: 'CS-2023-005',
    exam: 'Data Structures',
    examDayId: 5002,
    room: '208',
    description: 'Student marked present but not seen in seat after the first 30 minutes.',
    timestamp: '2026-09-14T11:20:00',
    status: 'REJECTED',
    evidence: null,
    reviewer: 'Sarah Mitchell',
    remarks: [{ at: '2026-09-14T14:00:00', by: 'Sarah Mitchell', text: 'Student confirmed present at seat; no issue found.' }],
    reportedBy: 'Prof. Neha Kulkarni',
    timeline: [
      { at: '2026-09-14T11:20:00', label: 'Reported', detail: 'Incident submitted by invigilator', by: 'Prof. Neha Kulkarni' },
      { at: '2026-09-14T14:00:00', label: 'Rejected', detail: 'No evidence of absence', by: 'Sarah Mitchell' },
    ],
  },
]

const INCIDENT_TYPES = ['Malpractice', 'Late Arrival', 'Technical Issue', 'Medical Issue', 'Attendance Issue', 'Other']
const STATUSES = ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED']
const SEVERITIES = ['Low', 'Medium', 'High', 'Critical']

function getBase() {
  return SEED_INCIDENTS.map((i) => JSON.parse(JSON.stringify(i)))
}

export async function getIncidents(filters = {}) {
  await delay(300)
  let list = readStore(INCIDENT_KEY, getBase())
  if (filters.status) list = list.filter((i) => i.status === filters.status)
  if (filters.severity) list = list.filter((i) => i.severity === filters.severity)
  if (filters.type) list = list.filter((i) => i.type === filters.type)
  if (filters.search) {
    const q = filters.search.toLowerCase()
    list = list.filter(
      (i) =>
        i.student.toLowerCase().includes(q) ||
        i.rollNumber.toLowerCase().includes(q) ||
        i.exam.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q),
    )
  }
  if (filters.reportedBy) list = list.filter((i) => i.reportedBy === filters.reportedBy)
  list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
  return { data: list, total: list.length }
}

export async function getIncidentById(id) {
  await delay(200)
  const list = readStore(INCIDENT_KEY, getBase())
  return list.find((i) => String(i.id) === String(id)) || null
}

export async function getIncidentStats() {
  await delay(200)
  const list = readStore(INCIDENT_KEY, getBase())
  return {
    total: list.length,
    open: list.filter((i) => i.status === 'OPEN').length,
    underReview: list.filter((i) => i.status === 'UNDER_REVIEW').length,
    resolved: list.filter((i) => i.status === 'RESOLVED').length,
    rejected: list.filter((i) => i.status === 'REJECTED').length,
    critical: list.filter((i) => i.severity === 'Critical').length,
    bySeverity: {
      low: list.filter((i) => i.severity === 'Low').length,
      medium: list.filter((i) => i.severity === 'Medium').length,
      high: list.filter((i) => i.severity === 'High').length,
      critical: list.filter((i) => i.severity === 'Critical').length,
    },
  }
}

export async function createIncident(payload, actorName = 'Teacher') {
  await delay(400)
  const list = readStore(INCIDENT_KEY, getBase())
  const id = list.reduce((m, i) => Math.max(m, i.id), 6000) + 1
  const now = new Date().toISOString()
  const incident = {
    id,
    type: payload.type || 'Other',
    severity: payload.severity || 'Medium',
    student: payload.student || '—',
    rollNumber: payload.rollNumber || '—',
    exam: payload.exam || 'General',
    examDayId: payload.examDayId || null,
    room: payload.room || '—',
    description: payload.description || '',
    timestamp: payload.timestamp || now,
    status: 'OPEN',
    evidence: payload.evidence || null,
    reviewer: null,
    remarks: [],
    reportedBy: actorName,
    timeline: [{ at: now, label: 'Reported', detail: 'Incident submitted', by: actorName }],
  }
  list.unshift(incident)
  writeStore(INCIDENT_KEY, list)
  logAuditEntry({ actor: actorName, role: 'teacher', action: 'CREATED', entity: 'Incident', entityId: id, detail: `Reported ${payload.type || 'incident'} for ${incident.student || 'unattributed'} (${incident.exam})` })
  return { ok: true, id, data: incident }
}

export async function updateIncident(id, patch, actorName = 'Sarah Mitchell') {
  await delay(300)
  const list = readStore(INCIDENT_KEY, getBase())
  const target = list.find((i) => String(i.id) === String(id))
  if (!target) return { ok: false }
  if (patch.reviewer !== undefined) {
    target.reviewer = patch.reviewer
    if (target.status === 'OPEN') target.status = 'UNDER_REVIEW'
    target.timeline = [...target.timeline, { at: new Date().toISOString(), label: 'Reviewed', detail: `Assigned reviewer: ${patch.reviewer}`, by: actorName }]
  }
  if (patch.remarkText) {
    target.remarks = [...target.remarks, { at: new Date().toISOString(), by: actorName, text: patch.remarkText }]
    target.timeline = [...target.timeline, { at: new Date().toISOString(), label: 'Remark', detail: patch.remarkText, by: actorName }]
  }
  writeStore(INCIDENT_KEY, list)
  logAuditEntry({ actor: actorName, role: 'admin', action: 'UPDATED', entity: 'Incident', entityId: id, detail: `Updated incident #${id} (${target.type})` })
  return { ok: true, data: target }
}

export async function decideIncident(id, decision, note, actorName = 'Sarah Mitchell') {
  await delay(350)
  const list = readStore(INCIDENT_KEY, getBase())
  const target = list.find((i) => String(i.id) === String(id))
  if (!target) return { ok: false }
  const label = decision === 'resolve' ? 'Resolved' : 'Rejected'
  target.status = decision === 'resolve' ? 'RESOLVED' : 'REJECTED'
  target.remarks = [...target.remarks, { at: new Date().toISOString(), by: actorName, text: note || `Marked ${label}` }]
  target.timeline = [...target.timeline, { at: new Date().toISOString(), label, detail: note || `Marked ${label}`, by: actorName }]
  writeStore(INCIDENT_KEY, list)
  logAuditEntry({ actor: actorName, role: 'admin', action: label === 'Resolved' ? 'RESOLVED' : 'REJECTED', entity: 'Incident', entityId: id, detail: `${label} incident #${id} (${target.type}) ${note ? `- ${note}` : ''}` })
  return { ok: true, data: target }
}

export { INCIDENT_TYPES, STATUSES, SEVERITIES }
