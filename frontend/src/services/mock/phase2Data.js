export const PHASE2_CLASSES = [
  { id: 1, name: 'SE-I B', division: 'B', department: 'Computer Science' },
  { id: 2, name: 'TE-II A', division: 'A', department: 'Electronics & Telecom' },
  { id: 3, name: 'BE-I C', division: 'C', department: 'Mechanical Engineering' },
  { id: 4, name: 'Class 5-A', division: 'A', department: 'General' },
]

export const PHASE2_SUBJECTS = [
  { id: 1, code: 'CS301', name: 'Data Structures' },
  { id: 2, code: 'CS302', name: 'Database Systems' },
  { id: 3, code: 'CS303', name: 'Operating Systems' },
  { id: 4, code: 'ENTC301', name: 'Embedded Systems' },
  { id: 5, code: 'MECH201', name: 'Thermodynamics' },
  { id: 6, code: 'MATH301', name: 'Mathematics-III' },
]

export const PHASE2_EXAMS = [
  { id: 31, name: 'End Semester Examination - Sem 3', short: 'ESE Sem 3', semester: 3 },
  { id: 32, name: 'Mid Semester Examination - Sem 4', short: 'MSE Sem 4', semester: 4 },
  { id: 33, name: 'Supplementary Exam - Sem 2', short: 'SUPP Sem 2', semester: 2 },
]

export const PHASE2_EXAM_DAYS = [
  {
    id: 5001,
    examId: 32,
    subject: 'Database Systems',
    code: 'CS302',
    yearSemester: 'Semester 5',
    date: '2026-09-14',
    time: '10:30 - 13:30',
    totalRegistered: 487,
  },
  {
    id: 5002,
    examId: 32,
    subject: 'Data Structures',
    code: 'CS301',
    yearSemester: 'Semester 5',
    date: '2026-09-14',
    time: '10:30 - 13:30',
    totalRegistered: 487,
  },
  {
    id: 5003,
    examId: 33,
    subject: 'Thermodynamics',
    code: 'MECH201',
    yearSemester: 'Semester 2',
    date: '2026-09-16',
    time: '09:00 - 12:00',
    totalRegistered: 118,
  },
]
