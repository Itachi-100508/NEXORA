const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms))

function matches(q, terms) {
  return terms.some((t) => q.includes(t))
}

export async function getIntelligenceAnswer(question, role) {
  await delay(500)
  const q = (question || '').toLowerCase()

  if (role === 'admin') {
    if (matches(q, ['exam day', 'exam-day'])) {
      return 'EXAMORA Intelligence — Demo Mode. For the current exam day (Database Systems, 14 Sep, 10:30-13:30) there are 12 rooms and 487 registered students. 92% present, 8% absent, 4 rooms still finalising attendance. 2 rooms need attention and 2 incidents are open. Open “Exam Day” for the live control centre.'
    }
    if (matches(q, ['incident'])) {
      return 'EXAMORA Intelligence — Demo Mode. Incident summary: 5 total, 2 open, 1 under review, 1 resolved, 1 rejected, and 1 critical. The most recent open incident is a malpractice case (Riya Patil, room 204, Database Systems) and a technical issue in room 208. Manage these from the Incidents module.'
    }
    if (matches(q, ['workload', 'teacher load'])) {
      return 'EXAMORA Intelligence — Demo Mode. Across 4 teachers the average workload utilisation is 72%. Karthik Menon is at 88% (flagged overloaded) with 31 assignments to grade. James Carter is at 76% with 24 pending. Balanced distribution recommended before the next cycle.'
    }
    if (matches(q, ['integrity', 'result integrity', 'verification'])) {
      return 'EXAMORA Intelligence — Demo Mode. Result integrity summary: verified document for Sem 3 (EXAM-8F3A-2026) is at version 4 after a revaluation that changed Database Systems from 88 to 91. Verification mode is demo — no cryptographic signature is claimed.'
    }
    if (matches(q, ['command', 'overview', 'status', 'exam center', 'command center'])) {
      return 'Your Exam Command Center shows 4 exams this cycle, 5 active alerts (2 high priority), 3 academic anomalies and an 85.9% overall pass rate. Mid Semester Examination - Sem 4 is next on 14 Sep. Open “Exam Command Center” for the full operations view.'
    }
    if (matches(q, ['alert', 'warning'])) {
      return 'The Smart Alert Engine currently flags 5 items: 1 high-priority low-attendance class (5-A at 58%), 1 upcoming lab clash, 1 invigilator under-allocation and 1 result irregularity. The newest alert is about Class 5-A attendance dropping below threshold.'
    }
    if (matches(q, ['anomaly', 'irregular', 'suspicious'])) {
      return 'Academic Anomaly Detection has flagged 5 cases — 2 high severity. The most critical is Rohan Gupta internal marks (34/30) exceeding the Database Systems maximum, and Class 5-A attendance below the 60% threshold. Recommend reviewing these from the Command Center anomalies panel.'
    }
    if (matches(q, ['calendar', 'schedule', 'upcoming exam'])) {
      return 'The next exam is Mid Semester Examination - Sem 4 starting 14 Sep: Data Structures on the 14th, Database Systems on the 15th and Embedded Systems viva on the 16th. Result publication for Sem 3 is set for 25 Sep.'
    }
    if (matches(q, ['seating', 'invigilat', 'roster'])) {
      return 'Seating plans are ready for Mid Semester Examination - Sem 4 across 3 rooms. Invigilation covers 4 duties with 2 chief invigilators assigned. The Supplementary Exam has an under-allocation of invigilators to resolve.'
    }
  }

  if (role === 'teacher') {
    if (matches(q, ['workload'])) {
      return 'EXAMORA Intelligence — Demo Mode. Your current workload: 18 teaching hours, 6 lab hours, 24 assignments to grade, 4 invigilation duties, 2 revaluation reviews and 16 mentoring students. Utilisation is at 76%. Next deadline is Operating Systems assignment 3 on 20 Sep.'
    }
    if (matches(q, ['incident', 'pending'])) {
      return 'EXAMORA Intelligence — Demo Mode. You have reported 2 incidents this cycle. The malpractice case (Riya Patil) is OPEN, and the attendance issue is REJECTED. Track and follow up on your reports from the Incidents module.'
    }
    if (matches(q, ['invigilat', 'duty', 'exam center', 'invigilation'])) {
      return 'Your upcoming invigilation duties: Chief Invigilator for Mid Semester Examination - Sem 4 on 14 Sep (10:30-13:30, Hall A). View all your assigned duties in the Invigilation page under your dashboard.'
    }
    if (matches(q, ['calendar', 'schedule', 'exam date'])) {
      return 'For your classes: Data Structures exam on 14 Sep and Database Systems on 15 Sep (SE-I B). Revaluation window for Sem 3 closes on 1 Oct. Check the Examination Calendar for the full timetable.'
    }
    if (matches(q, ['alert', 'attendance'])) {
      return 'Attendance monitoring shows your classes are healthy overall, but the system flags any student below the 60% attendance threshold. Use the attendance summary to review individual student trends.'
    }
  }

  if (role === 'student') {
    if (matches(q, ['journey', 'trend', 'progress'])) {
      return 'EXAMORA Intelligence — Demo Mode. Your academic journey shows consistent growth: CGPA rose from 7.6 (Sem 1) to 7.9 (Sem 2) and 8.6 (Sem 3). Your attendance trend (86 → 89 → 93%) closely tracks your SGPA improvement. Latest rank is 6 of 120.'
    }
    if (matches(q, ['compare', 'comparison', 'previous'])) {
      return 'EXAMORA Intelligence — Demo Mode. Comparing Sem 3 to Sem 2: SGPA rose from 8.2 to 8.7, attendance from 89% to 93%, and CGPA from 7.9 to 8.6. Your strongest subject is Database Systems (91); consider extra focus on Operating Systems (80).'
    }
    if (matches(q, ['attendance', 'correlation', 'relat'])) {
      return 'EXAMORA Intelligence — Demo Mode. Across your semesters, higher attendance correlates with higher SGPA (86%/7.8 → 89%/8.2 → 93%/8.7). Maintaining your ~93% attendance is likely supporting your strong results.'
    }
    if (matches(q, ['calendar', 'exam date', 'schedule', 'exam'])) {
      return 'Your class SE-I B has Data Structures on 14 Sep and Database Systems on 15 Sep (10:30-13:30). Operating Systems practical is on 18 Sep. Result publication for Sem 3 is scheduled for 25 Sep. Check the exam calendar for details.'
    }
    if (matches(q, ['cgpa', 'result', 'summary'])) {
      return 'Here is your academic summary: latest CGPA 8.6, Sem 3 percentage 84.0%, status PASS. Your performance has trended upward each semester. Remember — final marks are always published through the official result portal, never by AI.'
    }
  }

  return 'Here is my best understanding from the EXAMORA data. AI assistance is a UI helper for these demonstration flows — official marks, grades and results are computed and approved through the backend, never by AI.'
}

export async function getIntelligencePrompts(role) {
  await delay(200)
  if (role === 'admin') {
    return [
      'Give me an exam day summary',
      'What is the current incident summary?',
      'Show the teacher workload overview',
      'Give me a result integrity summary',
      'Give me an exam command center overview',
      'What alerts are active right now?',
      'Show pending academic anomalies',
      'What exams are coming up in the calendar?',
    ]
  }
  if (role === 'teacher') {
    return [
      'What is my current workload?',
      'Any pending incidents I reported?',
      'What are my upcoming invigilation duties?',
      'Which exam dates affect my classes?',
      'Any attendance alerts for my classes?',
    ]
  }
  return [
    'Show my academic journey and trend',
    'Compare my current semester with the previous one',
    'How does my attendance relate to my results?',
    'What are my upcoming exam dates?',
    'Show my academic summary and CGPA',
    'When are results published?',
  ]
}
