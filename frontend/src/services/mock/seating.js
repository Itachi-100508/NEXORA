import { delay, readStore, writeStore } from './phase1Storage'
import { PHASE1_CLASSES, PHASE1_SUBJECTS } from './phase1Data'

const SEATING_KEY = 'examora_seating_plans'
const ROWS_PER_ROOM = 6
const COLS_PER_ROOM = 6

const FIRST_NAMES = ['Aarav', 'Priya', 'Rohan', 'Aisha', 'Vivaan', 'Ananya', 'Aditya', 'Sara', 'Vihaan', 'Ishita', 'Arjun', 'Meera', 'Kavya', 'Nikhil', 'Diya', 'Sameer', 'Riya', 'Rahul', 'Simran', 'Ritika', 'Vedansh', 'Shreya', 'Dhruv', 'Tanya', 'Kabir', 'Neha', 'Krishna', 'Pooja', 'Sai', 'Divya']
const LAST_NAMES = ['Sharma', 'Patil', 'Gupta', 'Khan', 'Singh', 'Kumar', 'Verma', 'Rao', 'Iyer', 'Reddy', 'Nair', 'Menon', 'Mishra', 'Yadav', 'Desai', 'Joshi', 'Hegde', 'Naik', 'Gowda', 'Shetty']

function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const studentCache = {}
function getStudentsFor(classId, division) {
  const key = `${classId}-${division}`
  if (studentCache[key]) return studentCache[key]
  const rng = seededRandom(classId * 7 + (division ? division.charCodeAt(0) : 2) * 13)
  const count = 18 + Math.floor(rng() * 10)
  const students = []
  for (let i = 1; i <= count; i++) {
    const f = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)]
    const l = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)]
    students.push({
      id: classId * 10000 + i,
      rollNumber: `CLS${classId}-${division}-${String(i).padStart(3, '0')}`,
      name: `${f} ${l}`,
    })
  }
  studentCache[key] = students
  return students
}

function generateRooms(classId, division) {
  const students = getStudentsFor(classId, division)
  const rng = seededRandom(classId * 31 + (division ? division.charCodeAt(0) : 2))
  const shuffled = [...students].sort(() => rng() - 0.5)
  const roomCapacity = ROWS_PER_ROOM * COLS_PER_ROOM
  const roomCount = Math.ceil(shuffled.length / roomCapacity)
  const rooms = []
  let index = 0
  for (let r = 0; r < roomCount; r++) {
    const roomStudents = shuffled.slice(index, index + roomCapacity)
    index += roomCapacity
    const layout = []
    let seatNo = 1
    for (let row = 0; row < ROWS_PER_ROOM; row++) {
      for (let col = 0; col < COLS_PER_ROOM; col++) {
        const pos = row * COLS_PER_ROOM + col
        const student = roomStudents[pos]
        layout.push({
          row: row + 1,
          col: col + 1,
          seat: `${String.fromCharCode(65 + row)}${col + 1}`,
          seatNumber: seatNo++,
          student: student ? { id: student.id, rollNumber: student.rollNumber, name: student.name } : null,
        })
      }
    }
    rooms.push({
      roomId: r + 1,
      name: `Room ${r + 1}`,
      rows: ROWS_PER_ROOM,
      cols: COLS_PER_ROOM,
      layout,
    })
  }
  return { rooms, capacity: roomCount * roomCapacity, totalStudents: students.length }
}

export async function generateSeatingPlan(classId, division, examId = null) {
  await delay(600)
  const cls = PHASE1_CLASSES.find((c) => c.id === Number(classId))
  const className = cls ? cls.name : `Class ${classId} ${division}`
  const generated = generateRooms(Number(classId), division)
  const plan = {
    id: Date.now(),
    classId: Number(classId),
    division: division || 'A',
    className,
    examId: examId || null,
    rowsPerRoom: ROWS_PER_ROOM,
    colsPerRoom: COLS_PER_ROOM,
    rooms: generated.rooms,
    totalStudents: generated.totalStudents,
    capacity: generated.capacity,
    generatedAt: new Date().toISOString(),
  }
  const list = readStore(SEATING_KEY, [])
  list.push(plan)
  writeStore(SEATING_KEY, list)
  return { ok: true, plan }
}

export async function getSeatingPlans() {
  await delay(300)
  const list = readStore(SEATING_KEY, [])
  const enriched = list.map((p) => {
    const subject = PHASE1_SUBJECTS.find((s) => s.id === p.examId)
    return { ...p, subjectLabel: subject ? subject.name : 'General' }
  })
  return { data: enriched, total: enriched.length }
}

export async function getSeatingPlanById(id) {
  await delay(250)
  const list = readStore(SEATING_KEY, [])
  const plan = list.find((p) => p.id === Number(id)) || null
  if (!plan) return null
  const subject = PHASE1_SUBJECTS.find((s) => s.id === plan.examId)
  return { ...plan, subjectLabel: subject ? subject.name : 'General' }
}

export async function deleteSeatingPlan(id) {
  await delay(250)
  let list = readStore(SEATING_KEY, [])
  list = list.filter((p) => p.id !== Number(id))
  writeStore(SEATING_KEY, list)
  return { ok: true, id: Number(id) }
}

export { PHASE1_CLASSES as seatingClasses, PHASE1_SUBJECTS as seatingSubjects }
