import { delay, readStore, writeStore } from './phase1Storage'
import { PHASE1_TEACHERS, PHASE1_EXAMS } from './phase1Data'

const ROSTER_KEY = 'examora_invigilation_roster'

const SEED_DUTIES = [
  { id: 501, examId: 32, examName: 'Mid Semester Examination - Sem 4', teacherId: 14, teacherName: 'Anita Deshmukh', date: '2026-09-14', slot: '10:30 - 13:30', room: 'Hall A', role: 'Chief Invigilator' },
  { id: 502, examId: 32, examName: 'Mid Semester Examination - Sem 4', teacherId: 15, teacherName: 'Vijay Nair', date: '2026-09-14', slot: '10:30 - 13:30', room: 'Hall A', role: 'Invigilator' },
  { id: 503, examId: 32, examName: 'Mid Semester Examination - Sem 4', teacherId: 16, teacherName: 'Sunita Rao', date: '2026-09-15', slot: '10:30 - 13:30', room: 'Lab 2', role: 'Chief Invigilator' },
  { id: 504, examId: 32, examName: 'Mid Semester Examination - Sem 4', teacherId: 18, teacherName: 'Neha Kulkarni', date: '2026-09-15', slot: '10:30 - 13:30', room: 'Lab 2', role: 'Invigilator' },
  { id: 505, examId: 33, examName: 'Supplementary Exam - Sem 2', teacherId: 13, teacherName: 'Robert Lee', date: '2026-09-16', slot: '09:00 - 12:00', room: 'Hall B', role: 'Invigilator' },
  { id: 506, examId: 32, examName: 'Mid Semester Examination - Sem 4', teacherId: 11, teacherName: 'James Carter', date: '2026-09-14', slot: '10:30 - 13:30', room: 'Hall A', role: 'Chief Invigilator' },
]

function getBaseRoster() {
  return SEED_DUTIES.map((d) => ({ ...d }))
}

export async function getInvigilationRoster() {
  await delay(300)
  const existing = readStore(ROSTER_KEY, null)
  const list = existing && existing.length ? existing : getBaseRoster()
  if (!existing || !existing.length) writeStore(ROSTER_KEY, list)
  return { data: list, total: list.length }
}

export async function addInvigilationDuty(data) {
  await delay(400)
  const list = readStore(ROSTER_KEY, getBaseRoster())
  const teacher = PHASE1_TEACHERS.find((t) => t.id === Number(data.teacherId))
  const newDuty = {
    id: Date.now(),
    examId: data.examId || null,
    examName: data.examName || 'General',
    teacherId: Number(data.teacherId),
    teacherName: teacher ? teacher.name : 'Unassigned',
    date: data.date,
    slot: data.slot || '',
    room: data.room || '',
    role: data.role || 'Invigilator',
  }
  list.push(newDuty)
  writeStore(ROSTER_KEY, list)
  return { ok: true, duty: newDuty }
}

export async function removeInvigilationDuty(id) {
  await delay(250)
  let list = readStore(ROSTER_KEY, getBaseRoster())
  list = list.filter((d) => d.id !== Number(id))
  writeStore(ROSTER_KEY, list)
  return { ok: true, id: Number(id) }
}

export async function getTeacherInvigilationDuties(teacherId) {
  await delay(300)
  const list = readStore(ROSTER_KEY, getBaseRoster())
  const resolvedId = String(teacherId).startsWith('teacher-') ? 11 : Number(teacherId)
  return list.filter((d) => d.teacherId === resolvedId)
}

export async function getInvigilationStats() {
  await delay(200)
  const list = readStore(ROSTER_KEY, getBaseRoster())
  const rooms = new Set(list.map((d) => `${d.room}#${d.date}#${d.slot}`)).size
  return {
    totalDuties: list.length,
    assignedStaff: new Set(list.map((d) => d.teacherId)).size,
    activeRooms: rooms,
    chiefs: list.filter((d) => d.role === 'Chief Invigilator').length,
  }
}

export { PHASE1_TEACHERS as invigilatorTeachers, PHASE1_EXAMS as invigilatorExams }
