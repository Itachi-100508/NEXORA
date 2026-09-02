const delay = (ms = 450) => new Promise((r) => setTimeout(r, ms))

const roleAssistant = {
  admin: [
    "Show me the pass rate across classes this semester.",
    "Generate a department-wise performance report.",
    "Which class has the most failed students?",
    "Summarise pending mark submissions.",
  ],
  teacher: [
    "Which assignments still need marks entry?",
    "How does my class performance compare across subjects?",
    "Create a quick summary of my rejected submissions.",
    "What is the marking scheme for Data Structures?",
  ],
  student: [
    "Show my latest CGPA and result summary.",
    "Which subject did I score the lowest in?",
    "How has my performance trended across semesters?",
    "How do I request a revaluation?",
  ],
}

export function getSuggestedPrompts(role) {
  return roleAssistant[role] || roleAssistant.student
}

export async function getAIResponse(question, role, context = {}) {
  await delay(700)
  const q = (question || '').toLowerCase()

  if (role === 'student' && context.student) {
    const s = context.student
    if (q.includes('cgpa') || q.includes('result')) {
      return `Here is your academic summary, ${s.name}:\n\n• Latest CGPA: ${s.cgpa || '8.6'}\n• Latest percentage: ${s.percentage || '84.0'}%\n• Status: PASS · Semester ${s.semester || 3}\n\nYour performance has been trending upward. Keep it up!`
    }
    if (q.includes('lowest') || q.includes('weak')) {
      return 'Looking at your Sem 3 result, your lowest subject is Computer Networks at 82, which is still a strong A. Consider spending extra weekly effort there to keep it above 85.'
    }
    if (q.includes('trend')) {
      return 'Your percentage across semesters: Sem 1 → 72.0%, Sem 2 → 78.5%, Sem 3 → 84.0%. A steady upward trend of roughly +6% every semester. Nice work!'
    }
    if (q.includes('revaluation')) {
      return 'Revaluation is available within 7 days of result publication. Go to Results → the specific result → "Request Revaluation", pick the subject, and add a reason. Requests are reviewed within 5 working days and updates appear in your Revaluation tab.'
    }
  }

  if (role === 'teacher') {
    if (q.includes('entry') || q.includes('pending') || q.includes('marks')) {
      return 'You have 1 assignment awaiting marks entry (Data Structures) and 1 rejected submission (Database Systems) to correct and resubmit. Start from the Marks Entry page.'
    }
    if (q.includes('compare') || q.includes('performance') || q.includes('class')) {
      return 'Across your classes, SE-I B averages 68.4% with a 90.5% pass rate — well above college average. Keep the momentum in Data Structures and DBMS.'
    }
    if (q.includes('rejected') || q.includes('submit')) {
      return 'Database Systems was rejected because Rohan Gupta\u2019s internal marks exceeded the maximum. Correct it in the marks entry screen and use "Submit for Review" again.'
    }
    if (q.includes('marking')) {
      return 'Data Structures (CS301): Internal 30 + Theory 70 = 100. Passing marks: 40. Grade is awarded automatically based on the total, and results are final only after admin approval.'
    }
  }

  if (role === 'admin') {
    if (q.includes('pass rate') || q.includes('classes') || q.includes('semester')) {
      return 'This semester the overall pass rate is 85.9%, up 3.3% from last year. TE-II A has the lowest pass rate at 76.9% and BE-I C the highest at 93.8%.'
    }
    if (q.includes('report') || q.includes('generate')) {
      return 'You can generate a department-wise report from Reports → Generate Report → Department. I can prepare the parameters for a Computer Science 2025-26 report if you confirm.'
    }
    if (q.includes('fail')) {
      return 'Telecom batch TE-II A has the most failures this cycle (23%). I would recommend reviewing the Embedded Systems marking and scheduling a department meeting.'
    }
    if (q.includes('pending') || q.includes('submission')) {
      return 'There is 1 submission under review (Embedded Systems) and no un-reviewed approved results. All other cycles are complete.'
    }
  }

  return 'Here is my best understanding based on the demo data. AI assistance in EXAMORA is a UI helper for these demonstration flows — final marks and grades are always computed and approved through the backend, never by AI.'
}