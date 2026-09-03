import { delay, readStore } from './phase1Storage'

const WORKLOAD_KEY = 'examora_workload'

const WORKLOAD_TEACHERS = [
  {
    id: 'teacher-001',
    name: 'James Carter',
    department: 'Computer Science',
    summary: { teachingHours: 18, labs: 6, assignmentsToGrade: 24, examsInvigilated: 4, revaluations: 2, mentoring: 16, utilizationPercent: 76 },
    subjects: [
      { name: 'Data Structures', students: 120, sessions: 3, graded: 11, total: 12 },
      { name: 'Operating Systems', students: 96, sessions: 3, graded: 10, total: 12 },
    ],
    labs: [{ name: 'Data Structures Lab', groups: 4, hours: 6 }],
    upcoming: [
      { type: 'grading', title: 'Operating Systems assignment 3 submission review', deadline: '2026-09-20' },
      { type: 'exam', title: 'Invigilation - 109A (CS302)', date: '2026-09-18' },
      { type: 'revaluation', title: 'Database Systems review committee', date: '2026-09-17' },
    ],
    trend: [68, 70, 72, 74, 76],
  },
  {
    id: 'teacher-002',
    name: 'Priya Sharma',
    department: 'Computer Science',
    summary: { teachingHours: 15, labs: 4, assignmentsToGrade: 19, examsInvigilated: 3, revaluations: 1, mentoring: 12, utilizationPercent: 64 },
    subjects: [{ name: 'Database Systems', students: 130, sessions: 4, graded: 9, total: 10 }],
    labs: [{ name: 'Database Management Lab', groups: 3, hours: 4 }],
    upcoming: [
      { type: 'grading', title: 'Database Systems internal viva records', deadline: '2026-09-22' },
      { type: 'meeting', title: 'Board of Studies meeting', date: '2026-09-19' },
    ],
    trend: [60, 61, 63, 63, 64],
  },
  {
    id: 'teacher-003',
    name: 'Karthik Menon',
    department: 'Mechanical Engineering',
    summary: { teachingHours: 20, labs: 8, assignmentsToGrade: 31, examsInvigilated: 5, revaluations: 0, mentoring: 20, utilizationPercent: 88 },
    subjects: [{ name: 'Thermodynamics', students: 118, sessions: 5, graded: 8, total: 12 }],
    labs: [{ name: 'Thermodynamics Lab', groups: 5, hours: 8 }],
    upcoming: [
      { type: 'exam', title: 'Invigilation - 405C (MECH201)', date: '2026-09-16' },
      { type: 'grading', title: 'Thermodynamics assignment 2', deadline: '2026-09-25' },
    ],
    trend: [80, 82, 85, 86, 88],
  },
  {
    id: 'teacher-004',
    name: 'Sunita Rao',
    department: 'Electronics & Telecom',
    summary: { teachingHours: 14, labs: 3, assignmentsToGrade: 16, examsInvigilated: 2, revaluations: 3, mentoring: 10, utilizationPercent: 58 },
    subjects: [{ name: 'Embedded Systems', students: 88, sessions: 3, graded: 10, total: 11 }],
    labs: [{ name: 'Embedded Systems Lab', groups: 3, hours: 3 }],
    upcoming: [
      { type: 'revaluation', title: 'Embedded Systems revaluation review', date: '2026-09-18' },
      { type: 'grading', title: 'Embedded Systems practical journal', deadline: '2026-09-24' },
    ],
    trend: [55, 56, 56, 57, 58],
  },
]

export async function getTeacherWorkload(teacherId) {
  await delay(300)
  const list = readStore(WORKLOAD_KEY, WORKLOAD_TEACHERS)
  const match = list.find((t) => String(t.id) === String(teacherId)) || list[0]
  return { data: JSON.parse(JSON.stringify(match)), offline: true }
}

export async function getAllTeacherWorkload() {
  await delay(300)
  const list = readStore(WORKLOAD_KEY, WORKLOAD_TEACHERS)
  return { data: JSON.parse(JSON.stringify(list)), total: list.length }
}

export async function getWorkloadSummary() {
  await delay(250)
  const list = readStore(WORKLOAD_KEY, WORKLOAD_TEACHERS)
  const avg = (arr) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0)
  const overloaded = list.filter((t) => t.summary.utilizationPercent > 80)
  return {
    data: {
      teachers: list.length,
      avgUtilization: avg(list.map((t) => t.summary.utilizationPercent)),
      totalAssignmentsToGrade: list.reduce((a, t) => a + t.summary.assignmentsToGrade, 0),
      overloaded: overloaded.map((t) => ({ name: t.name, utilizationPercent: t.summary.utilizationPercent })),
      avgTeachingHours: avg(list.map((t) => t.summary.teachingHours)),
    },
  }
}
