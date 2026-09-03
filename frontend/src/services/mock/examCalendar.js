import { delay, readStore, writeStore } from './phase1Storage'
import { PHASE1_SUBJECTS, PHASE1_EXAMS } from './phase1Data'

const CALENDAR_KEY = 'examora_exam_calendar'

function todayISODate() {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

const SEED_EVENTS = [
  { id: 401, title: 'Data Structures - Theory', type: 'theory', subject: 'Data Structures', code: 'CS301', className: 'SE-I B', date: '2026-09-14', slot: '10:30 - 13:30', venue: 'Hall A', status: 'SCHEDULED', examId: 32 },
  { id: 402, title: 'Database Systems - Theory', type: 'theory', subject: 'Database Systems', code: 'CS302', className: 'SE-I B', date: '2026-09-15', slot: '10:30 - 13:30', venue: 'Lab 2', status: 'SCHEDULED', examId: 32 },
  { id: 403, title: 'Embedded Systems - Viva', type: 'viva', subject: 'Embedded Systems', code: 'ENTC301', className: 'TE-II A', date: '2026-09-16', slot: '09:00 - 11:00', venue: 'Seminar Room', status: 'SCHEDULED', examId: 32 },
  { id: 404, title: 'Thermodynamics - Theory', type: 'theory', subject: 'Thermodynamics', code: 'MECH201', className: 'BE-I C', date: '2026-09-17', slot: '10:30 - 13:30', venue: 'Hall B', status: 'SCHEDULED', examId: 32 },
  { id: 405, title: 'Operating Systems - Practical', type: 'practical', subject: 'Operating Systems', code: 'CS303', className: 'SE-I B', date: '2026-09-18', slot: '14:00 - 16:00', venue: 'Lab 3', status: 'SCHEDULED', examId: 32 },
  { id: 406, title: 'Result Publication - Sem 3', type: 'result', subject: 'Result Cycle', code: '', className: 'All', date: '2026-09-25', slot: '00:00', venue: '', status: 'CONFIRMED', examId: 31 },
  { id: 407, title: 'Revaluation Window Closes', type: 'deadline', subject: 'Revaluation', code: '', className: 'All', date: '2026-10-01', slot: '23:59', venue: '', status: 'CONFIRMED', examId: null },
]

function getBaseEvents() {
  return SEED_EVENTS.map((e) => ({ ...e }))
}

export async function getExamCalendarEvents() {
  await delay(300)
  const existing = readStore(CALENDAR_KEY, null)
  const list = existing && existing.length ? existing : getBaseEvents()
  if (!existing || !existing.length) writeStore(CALENDAR_KEY, list)
  return { data: list.map((e) => ({ ...e })), total: list.length }
}

export async function addExamCalendarEvent(data) {
  await delay(400)
  const list = readStore(CALENDAR_KEY, getBaseEvents())
  const newEvent = {
    id: Date.now(),
    title: data.title,
    type: data.type || 'theory',
    subject: data.subject || '',
    code: data.code || '',
    className: data.className || 'All',
    date: data.date,
    slot: data.slot || '',
    venue: data.venue || '',
    status: data.status || 'SCHEDULED',
    examId: data.examId || null,
  }
  list.push(newEvent)
  writeStore(CALENDAR_KEY, list)
  return { ok: true, event: newEvent }
}

export async function updateExamCalendarEvent(id, data) {
  await delay(400)
  const list = readStore(CALENDAR_KEY, getBaseEvents())
  const idx = list.findIndex((e) => e.id === Number(id))
  if (idx >= 0) list[idx] = { ...list[idx], ...data, id: Number(id) }
  writeStore(CALENDAR_KEY, list)
  return { ok: true, id: Number(id) }
}

export async function deleteExamCalendarEvent(id) {
  await delay(250)
  let list = readStore(CALENDAR_KEY, getBaseEvents())
  list = list.filter((e) => e.id !== Number(id))
  writeStore(CALENDAR_KEY, list)
  return { ok: true, id: Number(id) }
}

export function todayISODateExport() {
  return todayISODate()
}

export { PHASE1_SUBJECTS as calendarSubjects, PHASE1_EXAMS as calendarExams }
