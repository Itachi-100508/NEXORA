const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms))

export async function getAnalyticsData() {
  await delay(500)
  return {
    passFail: [
      { name: 'Pass', value: 82 },
      { name: 'Fail', value: 18 },
    ],
    subjectPerformance: [
      { subject: 'Data Structures', avg: 78, passRate: 92, max: 100 },
      { subject: 'Database Systems', avg: 74, passRate: 88, max: 100 },
      { subject: 'Operating Systems', avg: 71, passRate: 85, max: 100 },
      { subject: 'Computer Networks', avg: 69, passRate: 81, max: 100 },
      { subject: 'Embedded Systems', avg: 82, passRate: 94, max: 100 },
      { subject: 'Thermodynamics', avg: 66, passRate: 78, max: 100 },
    ],
    classPerformance: [
      { className: 'SE-I B', avg: 68.4, passRate: 90.5 },
      { className: 'SE-I A', avg: 71.2, passRate: 88.0 },
      { className: 'TE-II A', avg: 61.2, passRate: 76.9 },
      { className: 'TE-II B', avg: 63.8, passRate: 80.4 },
      { className: 'BE-I C', avg: 73.5, passRate: 93.8 },
    ],
    departmentComparison: [
      { dept: 'CS', students: 128, passRate: 88.2, avg: 71.0 },
      { dept: 'ENTC', students: 95, passRate: 82.1, avg: 65.4 },
      { dept: 'MECH', students: 84, passRate: 79.8, avg: 62.9 },
      { dept: 'CIVIL', students: 71, passRate: 85.9, avg: 68.1 },
    ],
    semesterComparison: [
      { sem: '2021-22', passRate: 72.1, avg: 59.8 },
      { sem: '2022-23', passRate: 75.4, avg: 61.2 },
      { sem: '2023-24', passRate: 78.2, avg: 63.0 },
      { sem: '2024-25', passRate: 82.6, avg: 65.5 },
      { sem: '2025-26', passRate: 85.9, avg: 68.3 },
    ],
    gradeDistribution: [
      { grade: 'A+', count: 120 },
      { grade: 'A', count: 340 },
      { grade: 'B+', count: 410 },
      { grade: 'B', count: 265 },
      { grade: 'C', count: 128 },
      { grade: 'D', count: 64 },
      { grade: 'F', count: 148 },
    ],
    performanceTrend: [
      { period: '2023-24', percentage: 62.0 },
      { period: '2024-25', percentage: 68.5 },
      { period: '2025-26', percentage: 76.9 },
    ],
  }
}