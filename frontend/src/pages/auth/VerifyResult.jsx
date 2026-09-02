import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, GraduationCap, Search, ShieldAlert, ShieldCheck } from 'lucide-react'
import { verifyResult } from '../../services/mock'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { formatDate } from '../../utils/helpers'

export default function VerifyResult() {
  const [searchParams] = useSearchParams()
  const [code, setCode] = useState(searchParams.get('code') || '')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const performVerification = async (codeToVerify) => {
    const cleanCode = (codeToVerify || code).trim()
    if (!cleanCode) return
    setBusy(true)
    setError(null)
    setResult(null)
    const res = await verifyResult({ code: cleanCode })
    setBusy(false)
    if (res.ok) {
      setResult(res.verification)
    } else {
      setError(res.message || 'The specified verification code was not found in official institutional records.')
    }
  }

  useEffect(() => {
    const paramCode = searchParams.get('code')
    if (paramCode) {
      setCode(paramCode)
      performVerification(paramCode)
    }
  }, [searchParams])

  const submit = (e) => {
    e.preventDefault()
    performVerification()
  }

  return (
    <div className="verify-wrap">
      <div className="verify-hero">
        <div className="flex items-center gap-3" style={{ justifyContent: 'center', marginBottom: 10 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: 'rgba(255,255,255,0.18)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <GraduationCap size={28} />
          </div>
        </div>
        <h1>Official Result Verification</h1>
        <p className="sub">Authenticate any EXAMORA university transcript or marksheet using its verification ID.</p>
      </div>

      <div className="verify-card">
        <form onSubmit={submit}>
          <div className="input-icon-wrap">
            <span className="input-icon">
              <Search size={17} />
            </span>
            <input
              className="form-control"
              placeholder="Enter verification ID e.g. EXAM-8F3A-2026"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
              aria-label="Verification code"
            />
          </div>
          <Button type="submit" loading={busy} className="btn-block" style={{ marginTop: 14 }}>
            {busy ? null : <ShieldCheck size={17} />}
            Verify Result
          </Button>
        </form>

        {busy && (
          <div className="flex items-center gap-2 muted" style={{ marginTop: 18, justifyContent: 'center' }}>
            <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
            Verifying cryptographic signature against institution records…
          </div>
        )}

        {result && (
          <div className="verify-result" style={{ marginTop: 20 }}>
            <div
              className="flex items-center gap-2"
              style={{
                color: 'var(--success)',
                fontWeight: 800,
                fontSize: 15,
                borderBottom: '1px solid var(--border)',
                paddingBottom: 10,
              }}
            >
              <CheckCircle2 size={22} /> ✓ VERIFIED RESULT
            </div>
            <div className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>
              This record is authenticated and matches the official publication archive.
            </div>

            <div
              className="doc-meta"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                margin: '14px 0 0',
                gap: '12px 18px',
                background: 'var(--surface-2)',
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div>
                <div className="k" style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600 }}>Student Name</div>
                <div className="v" style={{ fontWeight: 700, fontSize: 14 }}>{result.studentName}</div>
              </div>
              <div>
                <div className="k" style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600 }}>Verification ID</div>
                <div className="v" style={{ fontWeight: 800, fontFamily: 'monospace' }}>{result.verificationId}</div>
              </div>
              <div>
                <div className="k" style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600 }}>Examination</div>
                <div className="v" style={{ fontWeight: 600 }}>{result.exam || 'End Semester Examination'}</div>
              </div>
              <div>
                <div className="k" style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600 }}>Semester & Year</div>
                <div className="v" style={{ fontWeight: 600 }}>Semester {result.semester} · {result.academicYear}</div>
              </div>
              <div>
                <div className="k" style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600 }}>Result Status</div>
                <div className="v">
                  <Badge variant={result.status === 'PASS' ? 'success' : 'danger'}>{result.status}</Badge>
                </div>
              </div>
              <div>
                <div className="k" style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600 }}>Date of Issue</div>
                <div className="v" style={{ fontWeight: 600 }}>{formatDate(result.verifiedAt || new Date().toISOString())}</div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="verify-result fail" style={{ marginTop: 20 }}>
            <div
              className="flex items-center gap-2"
              style={{
                color: 'var(--danger)',
                fontWeight: 800,
                fontSize: 15,
                borderBottom: '1px solid var(--border)',
                paddingBottom: 10,
              }}
            >
              <ShieldAlert size={22} /> ✕ INVALID / UNVERIFIED RESULT
            </div>
            <div style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.5 }}>
              {error}
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
              Please check the code carefully or contact the Office of the Controller of Examinations.
            </div>
          </div>
        )}

        <div className="muted text-center" style={{ marginTop: 20, fontSize: 12.5 }}>
          Try a demo verification ID:{' '}
          <button
            type="button"
            className="btn-link"
            style={{
              fontWeight: 700,
              textDecoration: 'underline',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
            }}
            onClick={() => {
              setCode('EXAM-8F3A-2026')
              performVerification('EXAM-8F3A-2026')
            }}
          >
            EXAM-8F3A-2026
          </button>
        </div>
      </div>
    </div>
  )
}