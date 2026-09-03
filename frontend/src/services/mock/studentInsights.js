import { delay } from './phase1Storage'

const JOURNEY = [
  {
    semester: 1,
    academicYear: '2023-2024',
    cgpa: 7.6,
    sgpa: 7.8,
    rank: 18,
    totalStudents: 120,
    attendance: 86,
    subjects: [
      { name: 'Mathematics-I', marks: 74 },
      { name: 'Programming Fundamentals', marks: 78 },
      { name: 'Physics', marks: 68 },
      { name: 'Communication Skills', marks: 72 },
    ],
    credits: 24,
  },
  {
    semester: 2,
    academicYear: '2024-2025',
    cgpa: 7.9,
    sgpa: 8.2,
    rank: 12,
    totalStudents: 118,
    attendance: 89,
    subjects: [
      { name: 'Data Structures', marks: 82 },
      { name: 'Discrete Mathematics', marks: 76 },
      { name: 'Digital Logic', marks: 79 },
      { name: 'Object Oriented Programming', marks: 85 },
    ],
    credits: 26,
  },
  {
    semester: 3,
    academicYear: '2025-2026',
    cgpa: 8.6,
    sgpa: 8.7,
    rank: 6,
    totalStudents: 120,
    attendance: 93,
    subjects: [
      { name: 'Data Structures', marks: 86 },
      { name: 'Database Systems', marks: 91 },
      { name: 'Operating Systems', marks: 80 },
      { name: 'Computer Networks', marks: 82 },
    ],
    credits: 25,
  },
]

const CLASS_AVERAGES = {
  1: { sgpa: 7.1, attendance: 82 },
  2: { sgpa: 7.4, attendance: 84 },
  3: { sgpa: 7.7, attendance: 86 },
}

const INSIGHTS = [
  { id: 1, type: 'trend', title: 'Consistent upward growth', text: 'CGPA has risen every semester from 7.6 to 8.6, indicating strong and sustained improvement.', tone: 'positive' },
  { id: 2, type: 'strength', title: 'Core database strength', text: 'Database Systems (91) is the strongest subject, well above both your other subjects and the class average.', tone: 'positive' },
  { id: 3, type: 'weakness', title: 'Operating Systems needs focus', text: 'Operating Systems (80) is your lowest this semester and slightly below your own average. Consider dedicated revision.', tone: 'warning' },
  { id: 4, type: 'correlation', title: 'Attendance drives results', text: 'Your performance closely tracks attendance. Each semester where attendance rose, SGPA improved accordingly.', tone: 'info' },
  { id: 5, type: 'competitive', title: 'Rank improving among peers', text: 'You moved from rank 18 to rank 6. You now outperform 95% of your cohort overall.', tone: 'positive' },
  { id: 6, type: 'suggest', title: 'Proposed study focus', text: 'To maintain momentum, prioritise Operating Systems and Computer Networks for the next exam cycle.', tone: 'info' },
]

export async function getStudentJourney(studentId = 21, studentName = 'Aisha Khan') {
  await delay(300)
  return {
    data: {
      studentName,
      studentId,
      rollNumber: 'CS-2023-001',
      currentCgpa: 8.6,
      currentSgpa: 8.7,
      currentRank: 6,
      totalStudents: 120,
      semesters: JOURNEY.map((j) => ({ ...j, classSgpa: CLASS_AVERAGES[j.semester].sgpa, classAttendance: CLASS_AVERAGES[j.semester].attendance })),
      insights: INSIGHTS,
      classAverages: CLASS_AVERAGES,
    },
    offline: true,
  }
}

export async function getClassAverageComparison() {
  await delay(200)
  return {
    data: JOURNEY.map((j) => ({ semester: j.semester, sgpa: j.sgpa, classSgpa: CLASS_AVERAGES[j.semester].sgpa })),
    total: 3,
  }
}

export async function getAttendancePerformanceCorrelation(studentId = 21) {
  await delay(200)
  return {
    data: JOURNEY.map((j) => ({ semester: j.semester, attendance: j.attendance, sgpa: j.sgpa })),
    total: 3,
  }
}
