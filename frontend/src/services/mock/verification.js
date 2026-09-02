const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms))

const verificationCodes = {
  71: { valid: true, resultId: 71, studentName: 'Aisha Khan', verificationId: 'EXAM-7B21-2024', semester: 1, academicYear: '2023-2024' },
  72: { valid: true, resultId: 72, studentName: 'Rohan Gupta', verificationId: 'EXAM-2C44-2025', semester: 2, academicYear: '2024-2025' },
  73: { valid: true, resultId: 73, studentName: 'Aisha Khan', verificationId: 'EXAM-8F3A-2026', semester: 3, academicYear: '2025-2026' },
}

export async function verifyResult({ code }) {
  await delay(600)
  const key = String(code || '').trim().toUpperCase()
  const hit = verificationCodes[key]
  if (!hit) {
    return { ok: false, code, message: 'No result found for this verification code. Please check the code and try again.' }
  }
  return {
    ok: true,
    code: key,
    verification: {
      studentName: hit.studentName,
      verificationId: hit.verificationId,
      semester: hit.semester,
      academicYear: hit.academicYear,
      status: 'VERIFIED',
      verifiedAt: new Date().toISOString(),
    },
  }
}