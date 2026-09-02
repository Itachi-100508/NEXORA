const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

const reportStore = [
  { id: 1, type: 'performance', name: 'End Sem-3 Results (SE-I B)', period: '2025-2026 · Sem 3', generatedAt: '2026-08-28T10:30:00', students: 42, passRate: 90.5, avgMarks: 68.4, status: 'READY', size: '2.1 MB', downloadable: true },
  { id: 2, type: 'department', name: 'Department Performance - Computer Science', period: '2025-2026', generatedAt: '2026-08-01T11:00:00', students: 128, passRate: 88.2, avgMarks: 71.0, status: 'READY', size: '1.6 MB', downloadable: true },
  { id: 3, type: 'class', name: 'Class-Wise Comparison - TE-II A', period: '2024-2025 · Sem 4', generatedAt: '2026-06-15T09:00:00', students: 58, passRate: 76.9, avgMarks: 61.2, status: 'READY', size: '900 KB', downloadable: true },
  { id: 4, type: 'semester', name: 'Semester-Wise Trend 2023-2026', period: '2023-2026', generatedAt: '2026-07-20T14:00:00', students: 4021, passRate: 84.6, avgMarks: 66.8, status: 'GENERATING', size: '—', downloadable: false },
  { id: 5, type: 'consolidated', name: 'Consolidated Marksheet - All Subjects', period: '2025-2026', generatedAt: '2026-07-28T16:00:00', students: 391, passRate: 85.1, avgMarks: 69.0, status: 'READY', size: '3.4 MB', downloadable: true },
]

export const REPORT_TYPES = ['performance', 'department', 'class', 'semester', 'consolidated']

export async function getGeneratedReports() {
  await delay(300)
  return { data: [...reportStore].sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt)), total: reportStore.length }
}

export async function generateReport(type, range) {
  await delay(1100)
  reportStore.unshift({
    id: reportStore.reduce((m, r) => Math.max(m, r.id), 0) + 1,
    type,
    name: type === 'performance' ? 'Performance Report' : type === 'department' ? 'Department Report' : type === 'class' ? 'Class Report' : type === 'semester' ? 'Semester Trend Report' : 'Consolidated Marksheet',
    period: range || 'All time',
    generatedAt: new Date().toISOString(),
    students: 128,
    passRate: 87.3,
    avgMarks: 68.0,
    status: 'READY',
    size: '1.9 MB',
    downloadable: true,
  })
  return { ok: true }
}

export async function getReportPreview(type) {
  await delay(400)
  const preview = {
    performance: [
      { class: 'SE-I B', students: 42, passRate: 90.5, avgMarks: 68.4, toppers: 3 },
      { class: 'TE-II A', students: 38, passRate: 76.9, avgMarks: 61.2, toppers: 1 },
      { class: 'BE-I C', students: 48, passRate: 93.8, avgMarks: 73.5, toppers: 5 },
    ],
    department: [
      { dept: 'Computer Science', students: 128, passRate: 88.2, avgMarks: 71.0 },
      { dept: 'Electronics & Telecom', students: 95, passRate: 82.1, avgMarks: 65.4 },
      { dept: 'Mechanical Engg', students: 84, passRate: 79.8, avgMarks: 62.9 },
      { dept: 'Civil Engg', students: 71, passRate: 85.9, avgMarks: 68.1 },
    ],
    class: [
      { class: 'SE-I B', semester: 3, passRate: 90.5, avg: 68.4 },
      { class: 'TE-II A', semester: 4, passRate: 76.9, avg: 61.2 },
    ],
    semester: [
      { semester: '2023-2024', passRate: 78.2, avg: 63.0 },
      { semester: '2024-2025', passRate: 82.6, avg: 65.5 },
      { semester: '2025-2026', passRate: 85.9, avg: 68.3 },
    ],
    consolidated: [
      { semester: 1, cgpa: 7.6, percentage: 72.0 },
      { semester: 2, cgpa: 8.1, percentage: 78.5 },
      { semester: 3, cgpa: 8.6, percentage: 84.0 },
    ],
  }
  return { data: preview[type] || [], total: (preview[type] || []).length }
}