const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

let notificationStore = [
  { id: 11, type: 'SUCCESS', title: 'Marks approved', text: 'Thermodynamics marks were approved and published to results.', time: '2026-08-28T10:30:00', read: false, link: '/admin/results' },
  { id: 12, type: 'WARNING', title: 'Submission rejected', text: 'Database Systems marks were rejected. Please correct and resubmit.', time: '2026-08-27T09:15:00', read: false, link: '/teacher/rejected-marks' },
  { id: 13, type: 'INFO', title: 'New assignment', text: 'End Semester Examination - Sem 3 assignment assigned to you.', time: '2026-08-22T11:00:00', read: false, link: '/teacher/assignments' },
  { id: 14, type: 'SUCCESS', title: 'Result published', text: 'Results for Sem 3 are now live on the student portal.', time: '2026-08-21T16:40:00', read: false, link: '/admin/results' },
  { id: 15, type: 'ERROR', title: 'Verify attempted', text: 'A result verification attempt was rejected: invalid code EXAM-0000.', time: '2026-08-21T12:05:00', read: false, link: '/admin/verifications' },
  { id: 16, type: 'INFO', title: 'Semester starts soon', text: 'Mid Semester Examination - Sem 4 begins in two weeks.', time: '2026-08-01T08:00:00', read: false, link: '/admin/exams' },
  { id: 17, type: 'SUCCESS', title: 'New student enrolled', text: 'Sofia Rodriguez was added to SE-I B.', time: '2026-07-30T14:20:00', read: false, link: '/admin/students' },
  { id: 18, type: 'INFO', title: 'Weekly summary', text: '82% of students passed the last examination cycle.', time: '2026-07-28T09:00:00', read: false, link: '/admin/reports' },
]

export async function getNotifications() {
  await delay(200)
  return { data: [...notificationStore], total: notificationStore.length }
}

export async function getUnreadNotificationCount() {
  await delay(100)
  return notificationStore.filter((n) => !n.read).length
}

export async function markNotificationRead(id) {
  await delay(150)
  const n = notificationStore.find((n) => n.id === Number(id))
  if (n) n.read = true
  return { ok: true }
}

export async function markAllNotificationsRead() {
  await delay(250)
  notificationStore = notificationStore.map((n) => ({ ...n, read: true }))
  return { ok: true }
}