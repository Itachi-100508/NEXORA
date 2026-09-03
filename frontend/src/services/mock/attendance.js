const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms))

const CLASS_COUNT = 10
const DIVISIONS = ['A', 'B', 'C']
const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Krishna', 'Ishaan', 'Shaurya',
  'Atharv', 'Advik', 'Pranav', 'Advaith', 'Aarush', 'Hridhaan', 'Vedansh', 'Dhruv', 'Kabir', 'Arnav',
  'Raj', 'Rohan', 'Sameer', 'Aditya', 'Nikhil', 'Suraj', 'Karan', 'Nikhil', 'Deepak', 'Rahul',
  'Priya', 'Ananya', 'Diya', 'Aisha', 'Sara', 'Ishita', 'Nisha', 'Pooja', 'Riya', 'Kavya',
  'Meera', 'Sneha', 'Neha', 'Tanya', 'Pari', 'Simran', 'Ritika', 'Shreya', 'Mitali', 'Divya',
  'Sonia', 'Anjali', 'Deepika', 'Komal', 'Rekha', 'Sunita', 'Geeta', 'Suman', 'Usha', 'Vandana',
]
const LAST_NAMES = [
  'Sharma', 'Patil', 'Kumar', 'Singh', 'Gupta', 'Joshi', 'Desai', 'Verma', 'Rao', 'Iyer',
  'Reddy', 'Nair', 'Menon', 'Pillai', 'Mishra', 'Tiwari', 'Pandey', 'Yadav', 'Chauhan', 'Thakur',
  'Bhat', 'Kulkarni', 'Naik', 'Deshpande', 'Kamath', 'Prabhu', 'Hegde', 'Gowda', 'Shetty', 'Khan',
]

function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function generateStudents(classNum, division, seed = 1) {
  const rng = seededRandom(classNum * 100 + division.charCodeAt(0) + seed)
  const count = classNum === 5 && division === 'A' ? 50 : 25 + Math.floor(rng() * 26)
  const students = []
  for (let i = 1; i <= count; i++) {
    const firstIdx = Math.floor(rng() * FIRST_NAMES.length)
    const lastIdx = Math.floor(rng() * LAST_NAMES.length)
    students.push({
      id: classNum * 10000 + division.charCodeAt(0) * 100 + i,
      rollNumber: `CLS${classNum}-${division}-${String(i).padStart(3, '0')}`,
      name: `${FIRST_NAMES[firstIdx]} ${LAST_NAMES[lastIdx]}`,
    })
  }
  return students
}

function generateAttendanceForDate(students, date, rng) {
  const presentRatio = 0.7 + rng() * 0.25
  return students.map((s) => ({
    studentId: s.id,
    rollNumber: s.rollNumber,
    studentName: s.name,
    status: rng() < presentRatio ? 'PRESENT' : 'ABSENT',
  }))
}

function formatDateISO(d) {
  return d.toISOString().split('T')[0]
}

function getWeekDates(weekOffset = 0) {
  const now = new Date(2026, 8, 2)
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + weekOffset * 7)
  const dates = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(d)
  }
  return dates
}

const studentCache = {}
function getStudentsFor(classNum, division) {
  const key = `${classNum}-${division}`
  if (!studentCache[key]) {
    studentCache[key] = generateStudents(classNum, division)
  }
  return studentCache[key]
}

const attendanceStore = {}
let nextRecordId = 1

function initAttendance() {
  if (Object.keys(attendanceStore).length > 0) return
  const rng = seededRandom(42)
  for (let c = 1; c <= CLASS_COUNT; c++) {
    for (const div of DIVISIONS) {
      const students = getStudentsFor(c, div)
      const weekDates = getWeekDates(0)
      const prevWeekDates = getWeekDates(-1)
      const allDates = [...prevWeekDates, ...weekDates]
      for (const date of allDates) {
        const dateStr = formatDateISO(date)
        const key = `${c}-${div}-${dateStr}`
        attendanceStore[key] = {
          id: nextRecordId++,
          classId: c,
          className: `Class ${c}`,
          division: div,
          date: dateStr,
          students: generateAttendanceForDate(students, dateStr, rng),
          totalStudents: students.length,
          presentCount: 0,
          absentCount: 0,
          attendancePercentage: 0,
          markedBy: 'James Carter',
          createdAt: new Date(date).toISOString(),
          updatedAt: new Date(date).toISOString(),
        }
        const rec = attendanceStore[key]
        rec.presentCount = rec.students.filter((s) => s.status === 'PRESENT').length
        rec.absentCount = rec.students.filter((s) => s.status === 'ABSENT').length
        rec.attendancePercentage = Math.round((rec.presentCount / rec.totalStudents) * 10000) / 100
      }
    }
  }
}

initAttendance()

const ATTENDANCE_THRESHOLD = {
  excellent: 90,
  good: 75,
  low: 60,
}

export async function getAttendanceClasses() {
  await delay(150)
  return Array.from({ length: CLASS_COUNT }, (_, i) => ({
    id: i + 1,
    name: `Class ${i + 1}`,
  }))
}

export async function getAttendanceDivisions(_classId) {
  await delay(150)
  return DIVISIONS.map((d) => ({ id: d, name: `Division ${d}` }))
}

export async function getAttendanceStudents(classId, division) {
  await delay(250)
  return getStudentsFor(classId, division)
}

export async function getAttendanceRecord(classId, division, date) {
  await delay(300)
  const key = `${classId}-${division}-${date}`
  return attendanceStore[key] || null
}

export async function saveAttendanceRecord(data) {
  await delay(500)
  const key = `${data.classId}-${data.division}-${data.date}`
  const existing = attendanceStore[key]
  const presentCount = data.students.filter((s) => s.status === 'PRESENT').length
  const absentCount = data.students.filter((s) => s.status === 'ABSENT').length
  const totalStudents = data.students.length
  const record = {
    id: existing?.id || nextRecordId++,
    classId: data.classId,
    className: data.className || `Class ${data.classId}`,
    division: data.division,
    date: data.date,
    students: data.students,
    totalStudents,
    presentCount,
    absentCount,
    attendancePercentage: totalStudents > 0 ? Math.round((presentCount / totalStudents) * 10000) / 100 : 0,
    markedBy: data.markedBy || 'James Carter',
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  attendanceStore[key] = record
  return { ok: true, record }
}

export async function getAttendanceHistory(filters = {}) {
  await delay(300)
  let records = Object.values(attendanceStore)
  if (filters.classId) records = records.filter((r) => r.classId === Number(filters.classId))
  if (filters.division) records = records.filter((r) => r.division === filters.division)
  if (filters.dateFrom) records = records.filter((r) => r.date >= filters.dateFrom)
  if (filters.dateTo) records = records.filter((r) => r.date <= filters.dateTo)
  if (filters.search) {
    const q = filters.search.toLowerCase()
    records = records.filter(
      (r) =>
        r.className.toLowerCase().includes(q) ||
        r.division.toLowerCase().includes(q) ||
        r.date.includes(q) ||
        r.markedBy.toLowerCase().includes(q),
    )
  }
  records.sort((a, b) => b.date.localeCompare(a.date))
  const total = records.length
  const page = filters.page || 1
  const pageSize = filters.pageSize || 15
  const start = (page - 1) * pageSize
  return { data: records.slice(start, start + pageSize), total, page, pageSize }
}

export async function getWeeklyAttendance(classId, division, weekOffset = 0) {
  await delay(400)
  const dates = getWeekDates(weekOffset)
  const result = dates.map((date) => {
    const dateStr = formatDateISO(date)
    const key = `${classId}-${division}-${dateStr}`
    const record = attendanceStore[key]
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
    if (record) {
      return {
        date: dateStr,
        day: dayName,
        present: record.presentCount,
        absent: record.absentCount,
        total: record.totalStudents,
        percentage: record.attendancePercentage,
      }
    }
    const students = getStudentsFor(classId, division)
    return {
      date: dateStr,
      day: dayName,
      present: 0,
      absent: 0,
      total: students.length,
      percentage: 0,
    }
  })
  return {
    classId,
    className: `Class ${classId}`,
    division,
    weekOffset,
    startDate: formatDateISO(dates[0]),
    endDate: formatDateISO(dates[5]),
    days: result,
  }
}

export async function getMonthlyAttendance(classId, division, year, month) {
  await delay(400)
  const daysInMonth = new Date(year, month, 0).getDate()
  const result = []
  const rng = seededRandom(classId * 1000 + division.charCodeAt(0) + month)
  const students = getStudentsFor(classId, division)
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d)
    if (date.getDay() === 0) continue
    const dateStr = formatDateISO(date)
    const key = `${classId}-${division}-${dateStr}`
    const record = attendanceStore[key]
    if (record) {
      result.push({
        date: dateStr,
        present: record.presentCount,
        absent: record.absentCount,
        total: record.totalStudents,
        percentage: record.attendancePercentage,
      })
    } else {
      const present = Math.floor(students.length * (0.7 + rng() * 0.25))
      result.push({
        date: dateStr,
        present,
        absent: students.length - present,
        total: students.length,
        percentage: Math.round((present / students.length) * 10000) / 100,
      })
    }
  }
  return { classId, className: `Class ${classId}`, division, year, month, days: result }
}

export async function getStudentAttendanceSummary(classId, division) {
  await delay(350)
  const students = getStudentsFor(classId, division)
  const weekDates = getWeekDates(0)
  const prevWeekDates = getWeekDates(-1)
  const allDates = [...prevWeekDates, ...weekDates]
  return students.map((s) => {
    let present = 0
    let absent = 0
    for (const date of allDates) {
      const dateStr = formatDateISO(date)
      const key = `${classId}-${division}-${dateStr}`
      const record = attendanceStore[key]
      if (record) {
        const studentRec = record.students.find((st) => st.studentId === s.id)
        if (studentRec) {
          if (studentRec.status === 'PRESENT') present++
          else absent++
        }
      }
    }
    const total = present + absent
    return {
      ...s,
      present,
      absent,
      total,
      percentage: total > 0 ? Math.round((present / total) * 10000) / 100 : 0,
    }
  })
}

export async function getStudentOwnAttendance(studentId) {
  await delay(300)
  let targetStudentId = studentId
  if (studentId === 'student-001' || studentId === undefined || studentId === null) {
    const demo = getStudentsFor(5, 'A')
    targetStudentId = demo[0]?.id
  }
  const allRecords = Object.values(attendanceStore)
  const records = []
  for (const rec of allRecords) {
    const studentRec = rec.students.find((s) => s.studentId === targetStudentId)
    if (studentRec) {
      records.push({
        date: rec.date,
        className: rec.className,
        division: rec.division,
        status: studentRec.status,
      })
    }
  }
  records.sort((a, b) => b.date.localeCompare(a.date))
  let present = 0
  let absent = 0
  for (const r of records) {
    if (r.status === 'PRESENT') present++
    else absent++
  }
  const total = present + absent
  return {
    records,
    summary: {
      present,
      absent,
      total,
      percentage: total > 0 ? Math.round((present / total) * 10000) / 100 : 0,
    },
  }
}

export async function getAdminAttendanceOverview() {
  await delay(350)
  const records = Object.values(attendanceStore)
  const today = '2026-09-02'
  const todayRecords = records.filter((r) => r.date === today)
  const totalToday = todayRecords.reduce((a, r) => a + r.totalStudents, 0)
  const presentToday = todayRecords.reduce((a, r) => a + r.presentCount, 0)
  const totalRecords = records.length
  const classWise = {}
  for (const r of records) {
    if (!classWise[r.className]) classWise[r.className] = { present: 0, absent: 0, total: 0, records: 0 }
    classWise[r.className].present += r.presentCount
    classWise[r.className].absent += r.absentCount
    classWise[r.className].total += r.totalStudents
    classWise[r.className].records++
  }
  const classSummary = Object.entries(classWise).map(([name, data]) => ({
    className: name,
    present: data.present,
    absent: data.absent,
    total: data.total,
    percentage: data.total > 0 ? Math.round((data.present / data.total) * 10000) / 100 : 0,
    records: data.records,
  }))
  const recentRecords = records
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8)
  return {
    todayStats: {
      totalStudents: totalToday,
      present: presentToday,
      absent: totalToday - presentToday,
      percentage: totalToday > 0 ? Math.round((presentToday / totalToday) * 10000) / 100 : 0,
    },
    totalRecords,
    classSummary,
    recentRecords,
  }
}

export async function getLowAttendanceStudents(classId, division, threshold = ATTENDANCE_THRESHOLD.low) {
  await delay(300)
  const summaries = await getStudentAttendanceSummary(classId, division)
  return summaries.filter((s) => s.percentage < threshold)
}

export { ATTENDANCE_THRESHOLD }
