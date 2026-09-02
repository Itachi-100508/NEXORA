import { Award, GraduationCap, QrCode, ShieldCheck } from 'lucide-react'
import { formatDate } from '../../utils/helpers'

export default function ResultPreview({ result, summary, printerRef }) {
  if (!result) return null

  const subjects = result.subjects || []
  const totalMax = subjects.reduce((acc, s) => acc + (s.max || 100), 0)
  const totalObtained = subjects.reduce((acc, s) => acc + (s.marks || 0), 0)
  const earnedPoints = subjects.reduce(
    (acc, s) => acc + (s.credits || 0) * (s.points != null ? s.points : s.marks >= 90 ? 10 : s.marks >= 80 ? 9 : s.marks >= 70 ? 8 : s.marks >= 60 ? 7 : s.marks >= 50 ? 6 : s.marks >= 40 ? 5 : 0),
    0,
  )
  const totalCredits = subjects.reduce((acc, s) => acc + (s.credits || 0), 0)
  const sgpa = totalCredits ? (earnedPoints / totalCredits).toFixed(2) : (result.cgpa || '8.50')
  const percentage = result.percentage || (totalMax ? ((totalObtained / totalMax) * 100).toFixed(1) : '84.0')
  const isPass = result.status === 'PASS'

  const studentName = result.studentName || summary?.name || 'Aisha Khan'
  const rollNumber = summary?.rollNumber || result.rollNumber || 'CS-2023-001'
  const enrollmentNumber = summary?.enrollmentNumber || result.enrollmentNumber || 'EN-2023-CS-0842'
  const department = summary?.department || result.department || 'Department of Computer Science & Engineering'
  const examName = result.exam || 'End Semester Examination — Summer 2026'

  return (
    <div className="official-doc-container" ref={printerRef}>
      <div className="official-doc">
        {/* Anti-tamper watermark */}
        <div className="doc-watermark" aria-hidden="true">
          EXAMORA OFFICIAL TRANSCRIPT
        </div>

        {/* Institution Header */}
        <div className="doc-header">
          <div className="doc-header-top">
            <div className="doc-crest">
              <GraduationCap size={40} />
            </div>
            <div className="doc-title-group">
              <h2 className="doc-inst-name">EXAMORA INSTITUTE OF HIGHER EDUCATION</h2>
              <div className="doc-inst-sub">Office of the Controller of Examinations · Affiliated Academic Portal</div>
              <div className="doc-inst-address">Knowledge City, Sector 4, Academic District · ISO 9001:2025 Certified</div>
            </div>
            <div className="doc-security-badge">
              <ShieldCheck size={28} style={{ color: 'var(--primary)' }} />
              <span>DIGITALLY VERIFIED</span>
            </div>
          </div>

          <div className="doc-banner">
            STATEMENT OF MARKS & GRADES · SEMESTER {result.semester}
          </div>
        </div>

        {/* Student Credential Grid */}
        <div className="doc-meta-section">
          <div className="doc-meta-grid">
            <div className="doc-meta-cell">
              <span className="doc-k">Student Name</span>
              <span className="doc-v highlight">{studentName}</span>
            </div>
            <div className="doc-meta-cell">
              <span className="doc-k">Roll Number</span>
              <span className="doc-v">{rollNumber}</span>
            </div>
            <div className="doc-meta-cell">
              <span className="doc-k">Enrollment Number</span>
              <span className="doc-v">{enrollmentNumber}</span>
            </div>
            <div className="doc-meta-cell">
              <span className="doc-k">Academic Year</span>
              <span className="doc-v">{result.academicYear || '2025-2026'}</span>
            </div>
            <div className="doc-meta-cell doc-meta-span2">
              <span className="doc-k">Examination</span>
              <span className="doc-v">{examName}</span>
            </div>
            <div className="doc-meta-cell doc-meta-span2">
              <span className="doc-k">Department / Program</span>
              <span className="doc-v">{department}</span>
            </div>
          </div>
        </div>

        {/* Tabular Statement of Marks */}
        <div className="doc-table-wrap">
          <table className="doc-table">
            <thead>
              <tr>
                <th style={{ width: '12%' }}>Code</th>
                <th style={{ width: '38%' }}>Course / Subject Title</th>
                <th style={{ width: '10%' }} className="text-center">Credits</th>
                <th style={{ width: '10%' }} className="text-center">Max</th>
                <th style={{ width: '10%' }} className="text-center">Obtained</th>
                <th style={{ width: '10%' }} className="text-center">Grade</th>
                <th style={{ width: '10%' }} className="text-center">Result</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s, idx) => {
                const code = s.code || `CS30${idx + 1}`
                return (
                  <tr key={idx}>
                    <td className="doc-code">{code}</td>
                    <td className="doc-subject-name">{s.name}</td>
                    <td className="text-center">{s.credits || 4}</td>
                    <td className="text-center muted">{s.max || 100}</td>
                    <td className="text-center font-bold">{s.marks}</td>
                    <td className="text-center">
                      <span className="doc-grade-pill">{s.grade || (s.marks >= 80 ? 'A' : 'B')}</span>
                    </td>
                    <td className="text-center">
                      <span className={s.pass ? 'doc-pass-tag' : 'doc-fail-tag'}>
                        {s.pass ? 'PASS' : 'FAIL'}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {/* Grand Total Row */}
              <tr className="doc-grand-row">
                <td colSpan={2} className="doc-total-label">
                  GRAND TOTAL & PERFORMANCE
                </td>
                <td className="text-center font-bold">{totalCredits}</td>
                <td className="text-center muted">{totalMax}</td>
                <td className="text-center font-bold text-primary">{totalObtained}</td>
                <td colSpan={2} className="text-center font-bold">
                  {percentage}% · SGPA {result.cgpa || sgpa}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Performance & Status Summary */}
        <div className="doc-summary-grid">
          <div className="doc-metric-box">
            <div className="doc-metric-label">Semester Result</div>
            <div className={`doc-metric-val ${isPass ? 'success' : 'danger'}`}>
              {isPass ? '✓ PASS' : '✕ FAIL'}
            </div>
            <div className="doc-metric-sub">
              {isPass ? 'First Class with Distinction' : 'Compartment'}
            </div>
          </div>
          <div className="doc-metric-box">
            <div className="doc-metric-label">Percentage</div>
            <div className="doc-metric-val">{percentage}%</div>
            <div className="doc-metric-sub">{totalObtained} / {totalMax} aggregate marks</div>
          </div>
          <div className="doc-metric-box">
            <div className="doc-metric-label">Cumulative GPA</div>
            <div className="doc-metric-val">{result.cgpa || sgpa}</div>
            <div className="doc-metric-sub">Scale 10.0 · Credits: {totalCredits}</div>
          </div>
          <div className="doc-metric-box">
            <div className="doc-metric-label">Date of Issue</div>
            <div className="doc-metric-val" style={{ fontSize: 16 }}>
              {formatDate(result.issuedAt || new Date().toISOString())}
            </div>
            <div className="doc-metric-sub">Official Registry Publication</div>
          </div>
        </div>

        {/* Footer Seal, QR, Signatures */}
        <div className="doc-footer-section">
          <div className="doc-qr-block">
            <div className="doc-qr-box">
              <QrCode size={64} style={{ color: '#0F172A' }} />
            </div>
            <div className="doc-qr-meta">
              <div className="doc-qr-title">Digital Verification ID</div>
              <div className="doc-qr-code">{result.verificationId || 'EXAM-8F3A-2026'}</div>
              <div className="doc-qr-hint">Scan or verify at /verify-result</div>
            </div>
          </div>

          <div className="doc-seal-block">
            <div className="doc-seal">
              <Award size={36} />
              <span>OFFICIAL SEAL</span>
            </div>
          </div>

          <div className="doc-sign-block">
            <div className="doc-sign-line" />
            <div className="doc-sign-title">Controller of Examinations</div>
            <div className="doc-sign-sub">EXAMORA Academic Evaluation Board</div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="doc-legal-footer">
          <span>
            This document is a certified digital grade sheet generated by the EXAMORA Result Management System.
            Authenticity can be verified online using the QR code or the verification ID. Tampering invalidates this statement.
          </span>
        </div>
      </div>
    </div>
  )
}