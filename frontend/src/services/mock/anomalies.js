import { delay } from './phase1Storage'
import { PHASE1_TEACHERS, PHASE1_SUBJECTS, PHASE1_CLASSES } from './phase1Data'

const SEED_ANOMALIES = [
  {
    id: 201,
    type: 'marks_limit',
    severity: 'high',
    title: 'Internal marks exceed maximum',
    description: 'Rohan Gupta internal marks (34/30) exceed the subject maximum for Database Systems (CS302).',
    entity: 'Rohan Gupta',
    entityType: 'Student',
    subject: 'Database Systems',
    className: 'SE-I B',
    detectedBy: 'Marks Validation',
    detectedAt: '2026-08-21T13:40:00',
    status: 'UNRESOLVED',
    recommendation: 'Reset the internal marks and resubmit for review in the Marks Entry screen.',
  },
  {
    id: 202,
    type: 'score_trend_drop',
    severity: 'medium',
    title: 'Unusual score drop',
    description: 'Aisha Khan dropped from 86 in Data Structures to 62 in Database Systems, a 24-point dip across subjects.',
    entity: 'Aisha Khan',
    entityType: 'Student',
    subject: 'Database Systems',
    className: 'SE-I B',
    detectedBy: 'Performance Trend',
    detectedAt: '2026-08-21T13:50:00',
    status: 'REVIEWING',
    recommendation: 'Review the answer sheets for any clerical error before finalising.',
  },
  {
    id: 203,
    type: 'attendance_low',
    severity: 'high',
    title: 'Class attendance below threshold',
    description: 'Class 5-A weekly attendance is at 58%, below the 60% low-attendance threshold.',
    entity: 'Class 5-A',
    entityType: 'Class',
    subject: 'All',
    className: 'Class 5-A',
    detectedBy: 'Attendance Engine',
    detectedAt: '2026-09-01T08:05:00',
    status: 'UNRESOLVED',
    recommendation: 'Notify the class teacher and schedule a parent meeting for flagged students.',
  },
  {
    id: 204,
    type: 'malpractice_pattern',
    severity: 'medium',
    title: 'Suspicious answer similarity',
    description: 'Two students in BE-I C share identical answer patterns across 3 consecutive questions in Thermodynamics.',
    entity: 'BE-I C',
    entityType: 'Class',
    subject: 'Thermodynamics',
    className: 'BE-I C',
    detectedBy: 'Similarity Scan',
    detectedAt: '2026-08-19T15:10:00',
    status: 'FLAGGED',
    recommendation: 'Manually verify the affected scripts and seat adjacency under lockdown.',
  },
  {
    id: 205,
    type: 'submission_delay',
    severity: 'low',
    title: 'Submission milestone approaching',
    description: 'Embedded Systems marks are under review with less than 2 working days until the publish deadline.',
    entity: 'Embedded Systems',
    entityType: 'Subject',
    subject: 'Embedded Systems',
    className: 'TE-II A',
    detectedBy: 'Workflow Deadlines',
    detectedAt: '2026-08-25T09:30:00',
    status: 'UNRESOLVED',
    recommendation: 'Prioritise the verification queue for this submission.',
  },
]

const anomalyStore = SEED_ANOMALIES.map((a) => ({ ...a }))

export async function getAnomalies() {
  await delay(350)
  return { data: anomalyStore.map((a) => ({ ...a })), total: anomalyStore.length }
}

export async function resolveAnomaly(id, note = '') {
  await delay(300)
  const target = anomalyStore.find((a) => a.id === Number(id))
  if (target) {
    target.status = 'RESOLVED'
    target.resolvedNote = note || 'Marked as resolved by administrator.'
    target.resolvedAt = new Date().toISOString()
  }
  return { ok: true, id: Number(id) }
}

export async function getAnomalyStats() {
  await delay(200)
  return {
    total: anomalyStore.length,
    unresolved: anomalyStore.filter((a) => a.status === 'UNRESOLVED').length,
    reviewing: anomalyStore.filter((a) => a.status === 'REVIEWING').length,
    flagged: anomalyStore.filter((a) => a.status === 'FLAGGED').length,
    resolved: anomalyStore.filter((a) => a.status === 'RESOLVED').length,
    bySeverity: {
      high: anomalyStore.filter((a) => a.severity === 'high').length,
      medium: anomalyStore.filter((a) => a.severity === 'medium').length,
      low: anomalyStore.filter((a) => a.severity === 'low').length,
    },
  }
}

export { PHASE1_TEACHERS as matchableTeachers }

export function resolveTeacherName(id) {
  const t = PHASE1_TEACHERS.find((x) => x.id === Number(id))
  return t ? t.name : 'Unassigned'
}

export { PHASE1_SUBJECTS as matchableSubjects, PHASE1_CLASSES as matchableClasses }
