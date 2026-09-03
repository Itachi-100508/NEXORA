import { delay, readStore, writeStore } from './phase1Storage'
import { PHASE2_EXAM_DAYS } from './phase2Data'
import { PHASE1_TEACHERS } from './phase1Data'

const EXAM_DAY_KEY = 'examora_exam_day'

function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648
    return s / 2147483648
  }
}

function buildRooms(examDay, seed) {
  const rng = seededRandom(examDay.id + seed)
  const rooms = []
  let assigned = 0
  // 12 rooms across a few blocks covering registered students
  const roomDefs = [
    { number: 204, block: 'A', capacity: 48 },
    { number: 208, block: 'A', capacity: 50 },
    { number: 209, block: 'A', capacity: 45 },
    { number: 105, block: 'B', capacity: 40 },
    { number: 106, block: 'B', capacity: 44 },
    { number: 110, block: 'B', capacity: 38 },
    { number: 301, block: 'C', capacity: 52 },
    { number: 302, block: 'C', capacity: 48 },
    { number: 305, block: 'C', capacity: 46 },
    { number: 401, block: 'D', capacity: 42 },
    { number: 402, block: 'D', capacity: 44 },
    { number: 405, block: 'D', capacity: 50 },
  ]
  for (const def of roomDefs) {
    const students = Math.min(def.capacity, examDay.totalRegistered - assigned)
    assigned += students
    let status = 'ACTIVE'
    if (seed === 3) {
      status = rng() < 0.4 ? 'ISSUE' : 'ACTIVE'
    }
    rooms.push({
      id: examDay.id * 100 + def.number,
      number: String(def.number),
      block: def.block,
      capacity: def.capacity,
      className: rng() < 0.5 ? 'SE-I B' : rng() < 0.7 ? 'TE-II A' : 'BE-I C',
      division: rng() < 0.5 ? 'A' : 'B',
      students,
      present: Math.floor(students * (0.85 + rng() * 0.12)),
      absent: 0,
      attendanceStatus: seed === 2 && def.number === 401 ? 'PENDING' : 'COMPLETE',
      invigilator: PHASE1_TEACHERS[Math.floor(rng() * PHASE1_TEACHERS.length)].name,
      startTime: examDay.time.split(' - ')[0],
      endTime: examDay.time.split(' - ')[1],
      status,
      checkedIn: 0,
    })
    const last = rooms[rooms.length - 1]
    last.absent = last.students - last.present
    last.checkedIn = last.present
  }
  return rooms
}

function buildSession(data) {
  const rooms = buildRooms(data, data.roomsSeed || 1)
  const activeRooms = rooms.filter((r) => r.status === 'ACTIVE' || r.status === 'COMPLETED').length
  return {
    id: data.id,
    examId: data.examId,
    date: data.date,
    time: data.time,
    rooms,
    stats: {
      totalRooms: rooms.length,
      activeRooms,
      registered: data.totalRegistered,
      present: rooms.reduce((a, r) => a + r.present, 0),
      absent: rooms.reduce((a, r) => a + r.absent, 0),
      attendancePending: rooms.filter((r) => r.attendanceStatus === 'PENDING').length,
      invigilators: new Set(rooms.map((r) => r.invigilator)).size,
      issues: rooms.filter((r) => r.status === 'ISSUE').length,
    },
  }
}

const SEED_SESSIONS = [
  buildSession({ ...PHASE2_EXAM_DAYS[0], id: PHASE2_EXAM_DAYS[0].id, roomsSeed: 1 }),
  buildSession({ ...PHASE2_EXAM_DAYS[1], id: PHASE2_EXAM_DAYS[1].id, roomsSeed: 2 }),
  buildSession({ ...PHASE2_EXAM_DAYS[2], id: PHASE2_EXAM_DAYS[2].id, roomsSeed: 3 }),
]

export async function getExamDays() {
  await delay(250)
  return { data: PHASE2_EXAM_DAYS.map((e) => ({ ...e })), total: PHASE2_EXAM_DAYS.length }
}

export async function getExamDaySession(examDayId) {
  await delay(350)
  const stored = readStore(EXAM_DAY_KEY, null)
  if (stored && String(stored.id) === String(examDayId)) {
    return { ...stored, offlineStored: true }
  }
  return SEED_SESSIONS.find((s) => String(s.id) === String(examDayId)) || null
}

export async function updateRoomStatus(examDayId, roomNumber, status) {
  await delay(250)
  let session = await getExamDaySession(examDayId)
  if (!session) return { ok: false }
  const room = session.rooms.find((r) => String(r.number) === String(roomNumber))
  if (room) room.status = status
  if (room) {
    session.stats.activeRooms = session.rooms.filter((r) => r.status === 'ACTIVE' || r.status === 'COMPLETED').length
    session.stats.issues = session.rooms.filter((r) => r.status === 'ISSUE').length
  }
  writeStore(EXAM_DAY_KEY, session)
  return { ok: true, session }
}

export async function markRoomAttendance(examDayId, roomNumber, attendanceStatus) {
  await delay(250)
  let session = await getExamDaySession(examDayId)
  if (!session) return { ok: false }
  const room = session.rooms.find((r) => String(r.number) === String(roomNumber))
  if (room) {
    room.attendanceStatus = attendanceStatus
    session.stats.attendancePending = session.rooms.filter((r) => r.attendanceStatus === 'PENDING').length
  }
  writeStore(EXAM_DAY_KEY, session)
  return { ok: true, session }
}

export { buildSession }
