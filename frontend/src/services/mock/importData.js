const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms))

export async function parseImportFile(file) {
  await delay(900)
  const size = file?.size || 0
  return {
    fileName: file?.name || 'students-batch.csv',
    fileSize: size || 24812,
    rowsDetected: 6,
    validRows: 5,
    invalidRows: 1,
    columns: ['Roll Number', 'Student Name', 'Email', 'Department'],
    errors: [{ row: 3, msg: 'Missing email for roll CS-2023-003' }],
    preview: [
      { roll: 'CS-2023-001', name: 'Aisha Khan', department: 'CS' },
      { roll: 'CS-2023-002', name: 'Rohan Gupta', department: 'CS' },
      { roll: 'CS-2023-003', name: '', department: 'CS' },
      { roll: 'CS-2023-004', name: 'Vikram Singh', department: 'CS' },
      { roll: 'ENTC-2024-001', name: 'Arjun Patel', department: 'ENTC' },
      { roll: 'ENTC-2024-002', name: 'Neha Verma', department: 'ENTC' },
    ],
  }
}

export async function confirmImport(_fileName) {
  await delay(800)
  return { ok: true, imported: 5, skipped: 1 }
}