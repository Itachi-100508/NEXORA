const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms))

export const departments = [
  { id: 1, name: 'Computer Science', code: 'CS', status: 'ACTIVE' },
  { id: 2, name: 'Electronics & Telecom', code: 'ENTC', status: 'ACTIVE' },
  { id: 3, name: 'Mechanical Engineering', code: 'MECH', status: 'ACTIVE' },
  { id: 4, name: 'Civil Engineering', code: 'CIVIL', status: 'ACTIVE' },
]

export const classes = [
  { id: 1, name: 'SE-I B', department: 'Computer Science', year: 'SE', division: 'B', academicYear: '2025-2026', status: 'ACTIVE' },
  { id: 2, name: 'TE-II A', department: 'Electronics & Telecom', year: 'TE', division: 'A', academicYear: '2025-2026', status: 'ACTIVE' },
  { id: 3, name: 'BE-I C', department: 'Mechanical Engineering', year: 'BE', division: 'C', academicYear: '2025-2026', status: 'ACTIVE' },
]

export const subjects = [
  { id: 1, name: 'Data Structures', code: 'CS301', semester: 3, credits: 4, maxMarks: 100, passingMarks: 40, status: 'ACTIVE' },
  { id: 2, name: 'Database Systems', code: 'CS302', semester: 3, credits: 4, maxMarks: 100, passingMarks: 40, status: 'ACTIVE' },
  { id: 3, name: 'Operating Systems', code: 'CS303', semester: 3, credits: 3, maxMarks: 100, passingMarks: 40, status: 'ACTIVE' },
  { id: 4, name: 'Embedded Systems', code: 'ENTC301', semester: 4, credits: 4, maxMarks: 100, passingMarks: 40, status: 'ACTIVE' },
  { id: 5, name: 'Thermodynamics', code: 'MECH201', semester: 2, credits: 3, maxMarks: 100, passingMarks: 40, status: 'ACTIVE' },
]

const teachersStore = [
  { id: 11, name: 'James Carter', employeeId: 'EMP-1024', email: 'j.carter@examora.edu', department: 'Computer Science', status: 'ACTIVE' },
  { id: 12, name: 'Priya Sharma', employeeId: 'EMP-1102', email: 'p.sharma@examora.edu', department: 'Electronics & Telecom', status: 'ACTIVE' },
  { id: 13, name: 'Robert Lee', employeeId: 'EMP-1188', email: 'r.lee@examora.edu', department: 'Mechanical Engineering', status: 'ACTIVE' },
]

const studentsStore = [
  { id: 21, name: 'Aisha Khan', rollNumber: 'CS-2023-001', enrollmentNumber: 'ENR-23001', email: 'aisha.k@examora.edu', department: 'Computer Science', className: 'SE-I B', academicYear: '2025-2026', semester: 3, guardian: 'Ahmed Khan', phone: '+91 98765 01001', address: 'Pune, Maharashtra', status: 'ACTIVE' },
  { id: 22, name: 'Rohan Gupta', rollNumber: 'CS-2023-002', enrollmentNumber: 'ENR-23002', email: 'rohan.g@examora.edu', department: 'Computer Science', className: 'SE-I B', academicYear: '2025-2026', semester: 3, guardian: 'Sunil Gupta', phone: '+91 98765 01002', address: 'Mumbai, Maharashtra', status: 'ACTIVE' },
  { id: 23, name: 'Emily Watson', rollNumber: 'CS-2023-003', enrollmentNumber: 'ENR-23003', email: 'emily.w@examora.edu', department: 'Computer Science', className: 'SE-I B', academicYear: '2025-2026', semester: 3, guardian: 'Richard Watson', phone: '+91 98765 01003', address: 'Nashik, Maharashtra', status: 'ACTIVE' },
  { id: 24, name: 'Vikram Singh', rollNumber: 'CS-2023-004', enrollmentNumber: 'ENR-23004', email: 'vikram.s@examora.edu', department: 'Computer Science', className: 'SE-I B', academicYear: '2025-2026', semester: 3, guardian: 'Harpreet Singh', phone: '+91 98765 01004', address: 'Nagpur, Maharashtra', status: 'ACTIVE' },
  { id: 25, name: 'Sofia Rodriguez', rollNumber: 'CS-2023-005', enrollmentNumber: 'ENR-23005', email: 'sofia.r@examora.edu', department: 'Computer Science', className: 'SE-I B', academicYear: '2025-2026', semester: 3, guardian: 'Maria Rodriguez', phone: '+91 98765 01005', address: 'Pune, Maharashtra', status: 'ACTIVE' },
  { id: 26, name: 'Arjun Patel', rollNumber: 'CS-2023-006', enrollmentNumber: 'ENR-23006', email: 'arjun.p@examora.edu', department: 'Electronics & Telecom', className: 'TE-II A', academicYear: '2025-2026', semester: 4, guardian: 'Ramesh Patel', phone: '+91 98765 01006', address: 'Aurangabad, Maharashtra', status: 'ACTIVE' },
]

const examsStore = [
  { id: 31, name: 'End Semester Examination - Sem 3', semester: 3, academicYear: '2025-2026', startDate: '2026-05-01', endDate: '2026-05-15', status: 'ACTIVE' },
  { id: 32, name: 'Mid Semester Examination - Sem 4', semester: 4, academicYear: '2025-2026', startDate: '2026-08-10', endDate: '2026-08-18', status: 'UPCOMING' },
  { id: 33, name: 'Supplementary Exam - Sem 2', semester: 2, academicYear: '2024-2025', startDate: '2026-02-01', endDate: '2026-02-08', status: 'CLOSED' },
]

const assignmentsStore = [
  { id: 51, exam: 'End Semester Examination - Sem 3', examId: 31, className: 'SE-I B', classId: 1, subject: 'Data Structures', subjectId: 1, academicYear: '2025-2026', teacherId: 11, totalStudents: 5, maxInternal: 30, maxTheory: 70, maxPractical: 0, maxTotal: 100, status: 'DRAFT', createdAt: '2026-04-20T09:00:00' },
  { id: 52, exam: 'End Semester Examination - Sem 3', examId: 31, className: 'SE-I B', classId: 1, subject: 'Database Systems', subjectId: 2, academicYear: '2025-2026', teacherId: 11, totalStudents: 5, maxInternal: 30, maxTheory: 70, maxPractical: 0, maxTotal: 100, status: 'REJECTED', rejectionReason: 'Marks for Rohan Gupta exceed the practical maximum; total mismatch found during review.', submittedAt: '2026-08-21T13:20:00', createdAt: '2026-04-20T09:05:00' },
  { id: 53, exam: 'Mid Semester Examination - Sem 4', examId: 32, className: 'TE-II A', classId: 2, subject: 'Embedded Systems', subjectId: 4, academicYear: '2025-2026', teacherId: 12, totalStudents: 1, maxInternal: 20, maxTheory: 40, maxPractical: 40, maxTotal: 100, status: 'UNDER_REVIEW', submittedAt: '2026-08-20T10:30:00', createdAt: '2026-07-10T11:00:00' },
  { id: 54, exam: 'Supplementary Exam - Sem 2', examId: 33, className: 'BE-I C', classId: 3, subject: 'Thermodynamics', subjectId: 5, academicYear: '2024-2025', teacherId: 13, totalStudents: 3, maxInternal: 30, maxTheory: 70, maxPractical: 0, maxTotal: 100, status: 'APPROVED', submittedAt: '2026-02-10T09:00:00', createdAt: '2025-12-01T09:00:00' },
]

const assignmentMarksStore = {
  51: [
    { studentId: 21, rollNumber: 'CS-2023-001', studentName: 'Aisha Khan', internal: '', theory: '', practical: '' },
    { studentId: 22, rollNumber: 'CS-2023-002', studentName: 'Rohan Gupta', internal: '', theory: '', practical: '' },
    { studentId: 23, rollNumber: 'CS-2023-003', studentName: 'Emily Watson', internal: '', theory: '', practical: '' },
    { studentId: 24, rollNumber: 'CS-2023-004', studentName: 'Vikram Singh', internal: '', theory: '', practical: '' },
    { studentId: 25, rollNumber: 'CS-2023-005', studentName: 'Sofia Rodriguez', internal: '', theory: '', practical: '' },
  ],
  52: [
    { studentId: 21, rollNumber: 'CS-2023-001', studentName: 'Aisha Khan', internal: 26, theory: 60, practical: '' },
    { studentId: 22, rollNumber: 'CS-2023-002', studentName: 'Rohan Gupta', internal: 34, theory: 58, practical: '' },
    { studentId: 23, rollNumber: 'CS-2023-003', studentName: 'Emily Watson', internal: 28, theory: 62, practical: '' },
    { studentId: 24, rollNumber: 'CS-2023-004', studentName: 'Vikram Singh', internal: 22, theory: 48, practical: '' },
    { studentId: 25, rollNumber: 'CS-2023-005', studentName: 'Sofia Rodriguez', internal: 24, theory: 55, practical: '' },
  ],
  53: [
    { studentId: 26, rollNumber: 'CS-2023-006', studentName: 'Arjun Patel', internal: 17, theory: 35, practical: 36 },
  ],
  54: [
    { studentId: 21, rollNumber: 'CS-2023-001', studentName: 'Aisha Khan', internal: 24, theory: 58, practical: '' },
    { studentId: 22, rollNumber: 'CS-2023-002', studentName: 'Rohan Gupta', internal: 20, theory: 42, practical: '' },
    { studentId: 23, rollNumber: 'CS-2023-003', studentName: 'Emily Watson', internal: 22, theory: 51, practical: '' },
  ],
}

const resultsStore = [
  {
    id: 61,
    assignmentId: 53,
    teacher: 'Priya Sharma',
    className: 'TE-II A',
    subject: 'Embedded Systems',
    exam: 'Mid Semester Examination - Sem 4',
    submittedAt: '2026-08-20T10:30:00',
    students: 1,
    status: 'UNDER_REVIEW',
    marks: [
      { studentId: 26, rollNumber: 'CS-2023-006', studentName: 'Arjun Patel', internal: 17, theory: 35, practical: 36, total: 88, grade: 'A', pass: true },
    ],
  },
  {
    id: 62,
    assignmentId: 54,
    teacher: 'Robert Lee',
    className: 'BE-I C',
    subject: 'Thermodynamics',
    exam: 'Supplementary Exam - Sem 2',
    submittedAt: '2026-02-10T09:00:00',
    students: 3,
    status: 'APPROVED',
    marks: [
      { studentId: 21, rollNumber: 'CS-2023-001', studentName: 'Aisha Khan', internal: 24, theory: 58, practical: 0, total: 82, grade: 'A', pass: true },
      { studentId: 22, rollNumber: 'CS-2023-002', studentName: 'Rohan Gupta', internal: 20, theory: 42, practical: 0, total: 62, grade: 'B', pass: true },
      { studentId: 23, rollNumber: 'CS-2023-003', studentName: 'Emily Watson', internal: 22, theory: 51, practical: 0, total: 73, grade: 'B+', pass: true },
    ],
  },
  {
    id: 63,
    assignmentId: 52,
    teacher: 'James Carter',
    className: 'SE-I B',
    subject: 'Database Systems',
    exam: 'End Semester Examination - Sem 3',
    submittedAt: '2026-08-21T13:20:00',
    students: 5,
    status: 'REJECTED',
    rejectionReason: 'Marks for Rohan Gupta exceed the practical maximum; total mismatch found during review.',
    reviewedBy: 'Sarah Mitchell',
    marks: [
      { studentId: 21, rollNumber: 'CS-2023-001', studentName: 'Aisha Khan', internal: 26, theory: 60, practical: 0, total: 86, grade: 'A', pass: true },
      { studentId: 22, rollNumber: 'CS-2023-002', studentName: 'Rohan Gupta', internal: 34, theory: 58, practical: 0, total: 92, grade: 'A', pass: true },
      { studentId: 23, rollNumber: 'CS-2023-003', studentName: 'Emily Watson', internal: 28, theory: 62, practical: 0, total: 90, grade: 'A', pass: true },
      { studentId: 24, rollNumber: 'CS-2023-004', studentName: 'Vikram Singh', internal: 22, theory: 48, practical: 0, total: 70, grade: 'B+', pass: true },
      { studentId: 25, rollNumber: 'CS-2023-005', studentName: 'Sofia Rodriguez', internal: 24, theory: 55, practical: 0, total: 79, grade: 'B+', pass: true },
    ],
  },
]

const GRADES = [
  { min: 90, grade: 'A+', points: 10 },
  { min: 80, grade: 'A', points: 9 },
  { min: 70, grade: 'B+', points: 8 },
  { min: 60, grade: 'B', points: 7 },
  { min: 50, grade: 'C', points: 6 },
  { min: 40, grade: 'D', points: 5 },
  { min: 0, grade: 'F', points: 0 },
]

export function gradeForScore(score) {
  const g = GRADES.find((g) => score >= g.min) || GRADES[GRADES.length - 1]
  return { grade: g.grade, points: g.points, pass: g.grade !== 'F' }
}
export { GRADES }

const publishedResults = [
  {
    id: 71, studentId: 21, semester: 1, academicYear: '2023-2024', percentage: 72.0, cgpa: 7.6, status: 'PASS',
    issuedAt: '2024-06-30', verificationId: 'EXAM-7B21-2024',
    subjects: [
      { name: 'Mathematics-I', credits: 4, marks: 74, max: 100, grade: 'B+', pass: true },
      { name: 'Programming Fundamentals', credits: 4, marks: 78, max: 100, grade: 'B+', pass: true },
      { name: 'Physics', credits: 3, marks: 68, max: 100, grade: 'B', pass: true },
      { name: 'Communication Skills', credits: 2, marks: 72, max: 100, grade: 'B+', pass: true },
    ],
  },
  {
    id: 73, studentId: 21, semester: 3, academicYear: '2025-2026', percentage: 84.0, cgpa: 8.6, status: 'PASS',
    issuedAt: '2026-08-25', verificationId: 'EXAM-8F3A-2026',
    subjects: [
      { name: 'Data Structures', credits: 4, marks: 86, max: 100, grade: 'A', pass: true },
      { name: 'Database Systems', credits: 4, marks: 88, max: 100, grade: 'A', pass: true },
      { name: 'Operating Systems', credits: 3, marks: 80, max: 100, grade: 'A', pass: true },
      { name: 'Computer Networks', credits: 4, marks: 82, max: 100, grade: 'A', pass: true },
    ],
  },
  {
    id: 72, studentId: 22, semester: 2, academicYear: '2024-2025', percentage: 86.0, cgpa: 8.9, status: 'PASS',
    issuedAt: '2025-07-15', verificationId: 'EXAM-2C44-2025',
    subjects: [
      { name: 'Maths', credits: 4, marks: 89, max: 100, grade: 'A', pass: true },
      { name: 'Physics', credits: 3, marks: 83, max: 100, grade: 'A', pass: true },
    ],
  },
]

const studentPerformance = {
  21: [
    { semester: 1, percentage: 72.0, cgpa: 7.6 },
    { semester: 2, percentage: 78.5, cgpa: 8.1 },
    { semester: 3, percentage: 84.0, cgpa: 8.6 },
  ],
  22: [
    { semester: 1, percentage: 70.0, cgpa: 7.4 },
    { semester: 2, percentage: 86.0, cgpa: 8.9 },
  ],
}

export async function getStats(role) {
  await delay(500)
  if (role === 'admin') {
    return {
      stats: {
        totalStudents: studentsStore.length,
        totalTeachers: teachersStore.length,
        totalDepartments: departments.length,
        totalClasses: classes.length,
        activeExams: examsStore.filter((e) => e.status === 'ACTIVE').length,
        pendingSubmissions: resultsStore.filter((r) => ['SUBMITTED', 'UNDER_REVIEW'].includes(r.status)).length,
        approvedResults: resultsStore.filter((r) => r.status === 'APPROVED').length,
        publishedResults: publishedResults.length,
        rejected: resultsStore.filter((r) => r.status === 'REJECTED').length,
      },
      distribution: [
        { name: 'CS', students: 10 },
        { name: 'ENTC', students: 8 },
        { name: 'MECH', students: 6 },
        { name: 'CIVIL', students: 5 },
      ],
      passFail: [
        { name: 'Pass', value: 82 },
        { name: 'Fail', value: 18 },
      ],
      activity: [
        { id: 1, type: 'submitted', text: 'James Carter submitted marks for Database Systems', time: '2h ago' },
        { id: 2, type: 'approved', text: 'Admin approved result - Thermodynamics', time: '1d ago' },
        { id: 3, type: 'added', text: 'New student Aisha Khan added to SE-I B', time: '2d ago' },
        { id: 4, type: 'created', text: 'Exam Mid Semester Examination created', time: '3d ago' },
      ],
    }
  }
  if (role === 'teacher') {
    return {
      stats: {
        assignedClasses: 2,
        assignedSubjects: 3,
        pendingMarks: assignmentsStore.filter((a) => ['DRAFT', 'PENDING'].includes(a.status)).length,
        submittedMarks: assignmentsStore.filter((a) => ['SUBMITTED', 'UNDER_REVIEW'].includes(a.status)).length,
        approvedMarks: assignmentsStore.filter((a) => a.status === 'APPROVED').length,
        rejectedMarks: assignmentsStore.filter((a) => a.status === 'REJECTED').length,
      },
      recentSubmissions: [
        { id: 53, subject: 'Embedded Systems', className: 'TE-II A', status: 'UNDER_REVIEW', date: '2026-08-20' },
        { id: 52, subject: 'Database Systems', className: 'SE-I B', status: 'REJECTED', date: '2026-08-21' },
      ],
    }
  }
  return {
    stats: {
      latestCgpa: 8.6,
      latestPercentage: 84.0,
      resultStatus: 'PASS',
      currentSemester: 3,
      totalResults: publishedResults.filter((r) => r.studentId === 21).length,
    },
    latestResult: publishedResults.find((r) => r.studentId === 21 && r.semester === 3),
    previousResults: studentPerformance[21],
  }
}

export async function getStudents(params) {
  await delay(250)
  let data = [...studentsStore]
  if (params?.search) {
    const q = params.search.toLowerCase()
    data = data.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q) ||
        s.enrollmentNumber.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q),
    )
  }
  return { data, total: data.length }
}

export async function getTeachers() {
  await delay(250)
  return { data: teachersStore, total: teachersStore.length }
}

export async function getDepartments() {
  await delay(250)
  return { data: departments, total: departments.length }
}

export async function getClasses() {
  await delay(250)
  return { data: classes, total: classes.length }
}

export async function getSubjects() {
  await delay(250)
  return { data: subjects, total: subjects.length }
}

export async function getExams(params) {
  await delay(250)
  let data = [...examsStore]
  if (params?.search) {
    data = data.filter((e) => e.name.toLowerCase().includes(params.search.toLowerCase()))
  }
  if (params?.status) data = data.filter((e) => e.status === params.status)
  return { data, total: data.length }
}

export async function getAssignments(params) {
  await delay(250)
  let data = [...assignmentsStore].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
  if (params?.status) data = data.filter((a) => a.status === params.status)
  return { data, total: data.length }
}

export async function getAssignmentById(id) {
  await delay(200)
  return assignmentsStore.find((a) => a.id === Number(id)) || null
}

export async function getAssignmentStudents(assignmentId) {
  await delay(200)
  const assignment = assignmentsStore.find((a) => a.id === Number(assignmentId))
  if (!assignment) return []
  return studentsStore
    .filter((s) => s.className === assignment.className)
    .map((s) => {
      const saved = ((assignmentMarksStore[assignmentId] || []).find((m) => m.studentId === s.id)) || {}
      return {
        id: s.id,
        name: s.name,
        rollNumber: s.rollNumber,
        enrollmentNumber: s.enrollmentNumber,
        internal: saved.internal !== undefined ? saved.internal : '',
        theory: saved.theory !== undefined ? saved.theory : '',
        practical: saved.practical !== undefined ? saved.practical : '',
      }
    })
}

export async function saveMarksDraft(assignmentId, marks) {
  await delay(400)
  const current = assignmentMarksStore[assignmentId] || []
  const merged = current.map((row) => {
    const updated = marks[row.studentId]
    return updated ? { ...row, ...updated } : row
  })
  assignmentMarksStore[assignmentId] = merged
  return { ok: true, saved: merged.length }
}

export async function submitMarks(assignmentId, marks) {
  await delay(600)
  const current = assignmentMarksStore[assignmentId] || []
  const merged = current.map((row) => {
    const updated = marks[row.studentId]
    return updated ? { ...row, ...updated } : row
  })
  assignmentMarksStore[assignmentId] = merged
  const assignment = assignmentsStore.find((a) => a.id === Number(assignmentId))
  if (assignment) {
    assignment.status = 'UNDER_REVIEW'
    assignment.submittedAt = new Date().toISOString()
  }
  return { ok: true, assignmentId: Number(assignmentId) }
}

export async function getSubmissions() {
  await delay(250)
  const data = resultsStore.map((r) => {
    const asg = assignmentsStore.find((a) => a.id === r.assignmentId)
    return { ...r, status: asg?.status || r.status, rejectionReason: r.rejectionReason || asg?.rejectionReason }
  })
  return { data, total: data.length }
}

export async function getVerifications() {
  await delay(250)
  const data = resultsStore.map((r) => {
    const asg = assignmentsStore.find((a) => a.id === r.assignmentId)
    return { ...r, status: asg?.status || r.status, submissionCount: r.marks?.length || r.students, marks: r.marks || [] }
  })
  return { data, total: data.length }
}

export async function getReadyToPublish() {
  await delay(300)
  return { data: resultsStore.filter((r) => r.status === 'APPROVED'), total: 1 }
}

export async function getMyResults() {
  await delay(300)
  const data = publishedResults
    .filter((r) => r.studentId === 21)
    .sort((a, b) => b.semester - a.semester)
  return { data, total: data.length }
}

export async function getResultById(id) {
  await delay(250)
  return publishedResults.find((r) => r.id === Number(id)) || null
}

export async function getStudentPerformance(studentId) {
  await delay(250)
  return { data: studentPerformance[studentId] || [], total: (studentPerformance[studentId] || []).length }
}

export async function approveResult(resultId, note) {
  await delay(500)
  const result = resultsStore.find((r) => r.id === Number(resultId))
  const asg = result && assignmentsStore.find((a) => a.id === result.assignmentId)
  if (asg) asg.status = 'APPROVED'
  if (result) {
    result.status = 'APPROVED'
    result.reviewNote = note || 'Approved after verification.'
    result.decidedAt = new Date().toISOString()
  }
  return { ok: true, id: Number(resultId) }
}

export async function rejectResult(resultId, reason) {
  await delay(500)
  const result = resultsStore.find((r) => r.id === Number(resultId))
  const asg = result && assignmentsStore.find((a) => a.id === result.assignmentId)
  if (asg) {
    asg.status = 'REJECTED'
    asg.rejectionReason = reason
  }
  if (result) {
    result.status = 'REJECTED'
    result.rejectionReason = reason
    result.reviewedBy = 'Sarah Mitchell'
  }
  return { ok: true, id: Number(resultId) }
}

export async function publishResult(resultId) {
  await delay(500)
  return { ok: true, id: Number(resultId) }
}