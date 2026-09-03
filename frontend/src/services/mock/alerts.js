import { delay, readStore, writeStore } from './phase1Storage'

const ALERT_KEY = 'examora_alerts'

const SEED_ALERTS = [
  { id: 101, type: 'danger', title: 'Low attendance risk', text: 'Class 5-A has dropped to 58% weekly attendance, below the 60% threshold.', scope: 'Attendance', ref: 'Class 5-A', time: '2026-09-01T08:10:00', read: false, source: 'Anomaly Engine' },
  { id: 102, type: 'warning', title: 'Upcoming exam clash', text: 'SE-I B and TE-II A share Computer Lab 3 during the 10:30 slot on 14 Sep.', scope: 'Exam Calendar', ref: '14 Sep 10:30', time: '2026-08-31T14:00:00', read: false, source: 'Calendar Sync' },
  { id: 103, type: 'warning', title: 'Invigilator under-allocation', text: 'Supplementary Exam - Sem 2 has only 2 invigilators for 5 rooms.', scope: 'Invigilation', ref: 'Supplementary Exam - Sem 2', time: '2026-08-30T11:20:00', read: false, source: 'Roster Engine' },
  { id: 104, type: 'danger', title: 'Result irregularity detected', text: 'Rohan Gupta internal marks (34/30) exceed the maximum for Database Systems.', scope: 'Anomaly', ref: 'Database Systems', time: '2026-08-21T13:40:00', read: false, source: 'Anomaly Engine' },
  { id: 105, type: 'info', title: 'Marks pending review', text: 'Embedded Systems marks are awaiting admin approval before publishing.', scope: 'Verification', ref: 'Embedded Systems', time: '2026-08-20T10:40:00', read: false, source: 'Workflow' },
  { id: 106, type: 'info', title: 'Seating plan ready', text: 'Mid Semester Examination - Sem 4 seating plan generated for 3 rooms.', scope: 'Seating', ref: 'Mid Semester Examination - Sem 4', time: '2026-08-19T09:15:00', read: false, source: 'Seating Engine' },
  { id: 107, type: 'success', title: 'Result cycle complete', text: 'Thermodynamics marks approved and published to results.', scope: 'Results', ref: 'Thermodynamics', time: '2026-08-18T16:30:00', read: true, source: 'Workflow' },
]

function getBaseAlerts() {
  return SEED_ALERTS.map((a) => ({ ...a }))
}

export async function getAlerts() {
  await delay(300)
  const existing = readStore(ALERT_KEY, null)
  const list = existing && existing.length ? existing : getBaseAlerts()
  if (!existing || !existing.length) writeStore(ALERT_KEY, list)
  list.sort((a, b) => (b.time || '').localeCompare(a.time || ''))
  return { data: list, total: list.length }
}

export async function getUnreadAlertCount() {
  await delay(120)
  const list = readStore(ALERT_KEY, getBaseAlerts())
  return list.filter((a) => !a.read).length
}

export async function markAlertRead(id) {
  await delay(150)
  const list = readStore(ALERT_KEY, getBaseAlerts())
  const target = list.find((a) => a.id === Number(id))
  if (target) target.read = true
  writeStore(ALERT_KEY, list)
  return { ok: true, id: Number(id) }
}

export async function markAllAlertsRead() {
  await delay(200)
  const list = readStore(ALERT_KEY, getBaseAlerts())
  list.forEach((a) => { a.read = true })
  writeStore(ALERT_KEY, list)
  return { ok: true }
}

export async function dismissAlert(id) {
  await delay(150)
  let list = readStore(ALERT_KEY, getBaseAlerts())
  list = list.filter((a) => a.id !== Number(id))
  writeStore(ALERT_KEY, list)
  return { ok: true, id: Number(id) }
}
