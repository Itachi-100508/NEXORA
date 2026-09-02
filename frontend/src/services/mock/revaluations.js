const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

let revaluationStore = [
  {
    id: 81,
    resultId: 73,
    studentId: 21,
    studentName: 'Aisha Khan',
    rollNumber: 'CS-2023-001',
    semester: 3,
    subject: 'Database Systems',
    currentMarks: 88,
    requestReason: 'Expected a higher grade; believe theory answer 5 was under-evaluated.',
    status: 'REQUESTED',
    requestedAt: '2026-08-05T13:22:00',
    decidedBy: null,
    decisionNote: null,
    decidedAt: null,
    timeline: [
      { step: 'requested', label: 'Requested', note: 'Request submitted online', at: '2026-08-05T13:22:00' },
    ],
  },
  {
    id: 82,
    resultId: 73,
    studentId: 21,
    studentName: 'Aisha Khan',
    rollNumber: 'CS-2023-001',
    semester: 3,
    subject: 'Operating Systems',
    currentMarks: 80,
    requestReason: 'Checking the addition of internal marks.',
    status: 'UNDER_REVIEW',
    requestedAt: '2026-08-06T10:00:00',
    decidedBy: null,
    decisionNote: null,
    decidedAt: null,
    timeline: [
      { step: 'requested', label: 'Requested', note: 'Request submitted online', at: '2026-08-06T10:00:00' },
      { step: 'under_review', label: 'Under review', note: 'Assigned to review committee', at: '2026-08-07T09:30:00' },
    ],
  },
  {
    id: 83,
    resultId: 73,
    studentId: 22,
    studentName: 'Rohan Gupta',
    rollNumber: 'CS-2023-002',
    semester: 3,
    subject: 'Database Systems',
    currentMarks: 46,
    requestReason: 'Answer booklets may not have been fully totalled.',
    status: 'APPROVED',
    requestedAt: '2026-08-06T11:00:00',
    decidedBy: 'Sarah Mitchell',
    decisionNote: 'Re-evaluation confirmed current total is correct.',
    decidedAt: '2026-08-22T10:00:00',
    timeline: [
      { step: 'requested', label: 'Requested', note: 'Request submitted online', at: '2026-08-06T11:00:00' },
      { step: 'under_review', label: 'Under review', note: 'Second examiner assigned', at: '2026-08-07T09:30:00' },
      { step: 'approved', label: 'Approved', note: 'Original marks retained', at: '2026-08-22T10:00:00' },
    ],
  },
  {
    id: 84,
    resultId: 73,
    studentId: 23,
    studentName: 'Emily Watson',
    rollNumber: 'CS-2023-003',
    semester: 3,
    subject: 'Data Structures',
    currentMarks: 64,
    requestReason: 'Theory paper re-totalling requested.',
    status: 'COMPLETED',
    requestedAt: '2026-08-07T12:00:00',
    decidedBy: 'Sarah Mitchell',
    decisionNote: 'Marks revised: 86 total.',
    decidedAt: '2026-08-24T09:00:00',
    timeline: [
      { step: 'requested', label: 'Requested', note: 'Request submitted online', at: '2026-08-07T12:00:00' },
      { step: 'under_review', label: 'Under review', note: 'Second examiner assigned', at: '2026-08-08T10:00:00' },
      { step: 'approved', label: 'Approved', note: 'Revised marks published', at: '2026-08-24T09:00:00' },
      { step: 'completed', label: 'Completed', note: 'Result updated in statement of marks', at: '2026-08-24T12:00:00' },
    ],
  },
]

export async function getRevaluationRequests() {
  await delay(250)
  return { data: [...revaluationStore], total: revaluationStore.length }
}

export async function getMyRevaluations(studentId) {
  await delay(250)
  const data = revaluationStore
    .filter((r) => r.studentId === Number(studentId))
    .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))
  return { data, total: data.length }
}

export async function requestRevaluation(payload) {
  await delay(500)
  const id = revaluationStore.reduce((m, r) => Math.max(m, r.id), 80) + 1
  const now = new Date().toISOString()
  const newReq = {
    id,
    resultId: payload.resultId,
    studentId: Number(payload.studentId),
    studentName: payload.studentName || 'Aisha Khan',
    rollNumber: payload.rollNumber || 'CS-2023-001',
    semester: payload.semester || 3,
    subject: payload.subject,
    currentMarks: payload.currentMarks,
    requestReason: payload.reason,
    status: 'REQUESTED',
    requestedAt: now,
    decidedBy: null,
    decisionNote: null,
    decidedAt: null,
    timeline: [{ step: 'requested', label: 'Requested', note: 'Request submitted online', at: now }],
  }
  revaluationStore.unshift(newReq)
  return { ok: true, id, data: newReq }
}

export async function decideRevaluation(id, decision, note) {
  await delay(450)
  const req = revaluationStore.find((r) => r.id === Number(id))
  if (!req) return { ok: false }
  req.status = decision === 'approve' ? (req.status === 'COMPLETED' ? 'COMPLETED' : 'APPROVED') : 'REJECTED'
  req.decidedBy = 'Sarah Mitchell'
  req.decisionNote = note || 'Decision recorded.'
  req.decidedAt = new Date().toISOString()
  req.timeline = [
    ...req.timeline,
    {
      step: decision === 'approve' ? 'approved' : 'rejected',
      label: decision === 'approve' ? 'Approved' : 'Rejected',
      note: req.decisionNote,
      at: req.decidedAt,
    },
  ]
  return { ok: true, id: Number(id) }
}