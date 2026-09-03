import { delay, readStore, writeStore } from './phase1Storage'

const VERSION_KEY = 'examora_result_versions'

const SEED_VERSIONED_RESULTS = [
  {
    resultId: 73,
    studentName: 'Aisha Khan',
    rollNumber: 'CS-2023-001',
    semester: 3,
    exam: 'End Semester Examination - Sem 3',
    verificationId: 'EXAM-8F3A-2026',
    issuedAt: '2025-2026',
    status: 'PUBLISHED',
    currentVersion: 4,
    integrity: 'Valid',
    verification: 'demo',
    versions: [
      {
        version: 1,
        date: '2026-08-21T13:30:00',
        reason: 'Initial result computed and published',
        changedBy: 'System',
        status: 'PUBLISHED',
        subjects: [
          { name: 'Data Structures', marks: 86 },
          { name: 'Database Systems', marks: 88 },
          { name: 'Operating Systems', marks: 80 },
          { name: 'Computer Networks', marks: 82 },
        ],
        percentage: 84.0,
        cgpa: 8.6,
      },
      {
        version: 2,
        date: '2026-08-22T10:00:00',
        reason: 'Revaluation requested for Database Systems',
        changedBy: 'Aisha Khan',
        status: 'CHANGED',
        subjects: [
          { name: 'Data Structures', marks: 86 },
          { name: 'Database Systems', marks: 88 },
          { name: 'Operating Systems', marks: 80 },
          { name: 'Computer Networks', marks: 82 },
        ],
        percentage: 84.0,
        cgpa: 8.6,
      },
      {
        version: 3,
        date: '2026-08-24T09:00:00',
        reason: 'Revaluation review completed - marks updated',
        changedBy: 'Sarah Mitchell',
        status: 'CHANGED',
        subjects: [
          { name: 'Data Structures', marks: 86 },
          { name: 'Database Systems', marks: 91 },
          { name: 'Operating Systems', marks: 80 },
          { name: 'Computer Networks', marks: 82 },
        ],
        percentage: 84.75,
        cgpa: 8.7,
      },
      {
        version: 4,
        date: '2026-08-24T12:00:00',
        reason: 'Final result published after revaluation',
        changedBy: 'Sarah Mitchell',
        status: 'PUBLISHED',
        subjects: [
          { name: 'Data Structures', marks: 86 },
          { name: 'Database Systems', marks: 91 },
          { name: 'Operating Systems', marks: 80 },
          { name: 'Computer Networks', marks: 82 },
        ],
        percentage: 84.75,
        cgpa: 8.7,
      },
    ],
  },
  {
    resultId: 71,
    studentName: 'Aisha Khan',
    rollNumber: 'CS-2023-001',
    semester: 1,
    exam: 'End Semester Examination - Sem 1',
    verificationId: 'EXAM-7B21-2024',
    issuedAt: '2023-2024',
    status: 'PUBLISHED',
    currentVersion: 1,
    integrity: 'Valid',
    verification: 'demo',
    versions: [
      {
        version: 1,
        date: '2024-06-30T10:00:00',
        reason: 'Initial result computed and published',
        changedBy: 'System',
        status: 'PUBLISHED',
        subjects: [
          { name: 'Mathematics-I', marks: 74 },
          { name: 'Programming Fundamentals', marks: 78 },
          { name: 'Physics', marks: 68 },
          { name: 'Communication Skills', marks: 72 },
        ],
        percentage: 72.0,
        cgpa: 7.6,
      },
    ],
  },
]

const versionedStore = SEED_VERSIONED_RESULTS.map((r) => ({
  ...r,
  versions: r.versions.map((v) => ({ ...v, subjects: v.subjects.map((s) => ({ ...s })) })),
}))

export async function getVersionedResults() {
  await delay(300)
  return { data: versionedStore.map((r) => ({ ...r, versions: r.versions.map((v) => ({ ...v, subjects: v.subjects.map((s) => ({ ...s })) })) })), total: versionedStore.length }
}

export async function getVersionedResultById(resultId) {
  await delay(250)
  const r = versionedStore.find((x) => String(x.resultId) === String(resultId))
  return r ? { ...r, versions: r.versions.map((v) => ({ ...v, subjects: v.subjects.map((s) => ({ ...s })) })) } : null
}

export async function getIntegritySummary(resultId) {
  await delay(200)
  const r = versionedStore.find((x) => String(x.resultId) === String(resultId))
  if (!r) return null
  return {
    verificationId: r.verificationId,
    version: r.currentVersion,
    issuedAt: r.issuedAt,
    status: r.status,
    integrity: r.integrity,
    verification: r.verification,
    studentName: r.studentName,
    semester: r.semester,
  }
}

export { versionedStore }
