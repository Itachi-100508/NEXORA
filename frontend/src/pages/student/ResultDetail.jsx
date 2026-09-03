import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download, FileSearch, Printer, ShieldCheck, GitBranch } from 'lucide-react'
import { getResultById } from '../../services/mock'
import { resultVersionService, integrityService } from '../../services'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import Breadcrumb from '../../components/ui/Breadcrumb'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import ResultPreview from '../../components/result/ResultPreview'
import Loader from '../../components/ui/Loader'
import ErrorState from '../../components/ui/ErrorState'
import { formatDateTime } from '../../utils/helpers'

const versionStatusVariant = {
  PUBLISHED: 'success',
  CHANGED: 'warning',
  DRAFT: 'muted',
}

export default function ResultDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const docRef = useRef(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [versionEntry, setVersionEntry] = useState(null)
  const [integrity, setIntegrity] = useState(null)
  const [detailOffline, setDetailOffline] = useState(false)

  useEffect(() => {
    getResultById(id).then((r) => {
      setResult(r)
      setLoading(false)
    })
  }, [id])

  useEffect(() => {
    let mounted = true
    resultVersionService.getByResultId(id).then((res) => {
      if (!mounted) return
      setVersionEntry(res.data)
      setDetailOffline(Boolean(res.offline))
    })
    integrityService.getSummary(id).then((res) => {
      if (mounted && res.data) setIntegrity(res.data)
    })
    return () => {
      mounted = false
    }
  }, [id])

  if (loading) return <Loader />
  if (!result) return <ErrorState message="Result not found" onRetry={() => navigate('/student/results')} />

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'My Results', to: '/student/results' },
          { label: `Semester ${result.semester}` },
        ]}
      />

      <div className="page-header">
        <div>
          <h1>Result — Semester {result.semester}</h1>
          <div className="sub">{result.academicYear} · {user?.name}</div>
        </div>
        <div className="page-actions">
          <Button variant="outline" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</Button>
          <Button variant="outline" onClick={() => toast.info('Preparing marksheet', 'Your marksheet PDF download will begin shortly.')}><Download size={16} /> Download</Button>
          <Button variant="soft-primary" onClick={() => navigate('/student/revaluation')}><FileSearch size={16} /> Request Revaluation</Button>
          <Button onClick={() => window.print()}><Printer size={16} /> Print</Button>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        {[
          { k: 'Percentage', v: `${result.percentage}%`, c: 'var(--primary)' },
          { k: 'Grade', v: result.cgpa >= 9 ? 'A+' : result.cgpa >= 8 ? 'A' : result.cgpa >= 7 ? 'B+' : 'B', c: 'var(--secondary)' },
          { k: 'CGPA', v: result.cgpa, c: 'var(--warning)' },
          { k: 'Result', v: result.status, c: result.status === 'PASS' ? 'var(--success)' : 'var(--danger)' },
        ].map((x, i) => (
          <Card key={i} padded className="text-center">
            <div className="muted" style={{ fontSize: 12 }}>{x.k}</div>
            <div style={{ fontSize: 24, fontWeight: 800, margin: '6px 0', color: x.c }}>{x.v}</div>
            {x.k === 'Result' && <small className="muted">Verified document</small>}
          </Card>
        ))}
      </div>

      <div className="grid grid-2-wide">
        <ResultPreview result={result} summary={{ name: user?.name, rollNumber: user?.rollNumber }} printerRef={docRef} />
        <Card>
          <div className="card-header"><h3>Actions</h3></div>
          <div className="card-body flex flex-col" style={{ gap: 12 }}>
            <Button variant="outline" onClick={() => navigate(`/student/marksheet/${result.id}`)}>
              <Download size={16} /> Download official marksheet
            </Button>
            <Button variant="outline" onClick={() => window.open(`/verify-result?code=${result.verificationId}`, '_blank')}>
              <Printer size={16} /> Open verification proof
            </Button>
            <Button variant="danger-soft" onClick={() => navigate('/student/revaluation')}>
              <FileSearch size={16} /> Request revaluation (₹500)
            </Button>
            <div className="muted" style={{ fontSize: 12.5, padding: 12, background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)' }}>
              Revaluation must be requested within <b>7 days</b> of publication. Decisions are communicated in the Revaluation tab within 5 working days.
            </div>
          </div>
        </Card>
      </div>

      {versionEntry && (
        <div style={{ marginTop: 20 }}>
          <div className="flex items-center" style={{ gap: 8, marginBottom: 12 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800 }}>Version History & Integrity</h2>
            {detailOffline && <Badge variant="warning">Demo/Offline</Badge>}
          </div>
          <div className="grid grid-2-wide">
            <Card>
              <div className="card-header">
                <h3><GitBranch size={16} /> Version History</h3>
              </div>
              <div className="card-body" style={{ padding: '10px 22px' }}>
                {[...versionEntry.versions].reverse().map((v, idx) => (
                  <div key={v.version} className="flex items-center justify-between" style={{ padding: '12px 0', borderBottom: idx < versionEntry.versions.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>
                        Version {v.version}
                        {v.version === versionEntry.currentVersion && <Badge variant="accent" style={{ marginLeft: 6 }}>Current</Badge>}
                      </div>
                      <div className="muted" style={{ fontSize: 12 }}>{formatDateTime(v.date)} · {v.changedBy}</div>
                      <div style={{ fontSize: 12.5, marginTop: 3 }}>{v.reason}</div>
                    </div>
                    <Badge variant={versionStatusVariant[v.status] || 'neutral'}>{v.status}</Badge>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <div className="card-header"><h3><ShieldCheck size={16} /> Integrity</h3></div>
              <div className="card-body">
                {integrity ? (
                  <div className="flex flex-col" style={{ gap: 12 }}>
                    <div className="flex items-center" style={{ gap: 10 }}>
                      <ShieldCheck size={28} color="var(--success)" />
                      <div>
                        <div style={{ fontWeight: 700 }}>Digitally Verified by EXAMORA</div>
                        <Badge variant="warning">Demo Verification</Badge>
                      </div>
                    </div>
                    <div className="grid grid-2" style={{ gap: 10 }}>
                      {[
                        { k: 'Verification ID', v: integrity.verificationId },
                        { k: 'Current Version', v: `v${integrity.version}` },
                        { k: 'Issue', v: integrity.issuedAt },
                        { k: 'Status', v: integrity.status },
                        { k: 'Integrity', v: integrity.integrity },
                        { k: 'Mode', v: integrity.verification === 'demo' ? 'Demo' : integrity.verification },
                      ].map((x) => (
                        <div key={x.k} style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
                          <div className="muted" style={{ fontSize: 11 }}>{x.k}</div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{x.v}</div>
                        </div>
                      ))}
                    </div>
                    <div className="muted" style={{ fontSize: 12, padding: 10, background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)' }}>
                      Demonstration verification only — no cryptographic signature claimed. Use QR Verification for official proof.
                    </div>
                  </div>
                ) : (
                  <div className="muted" style={{ fontSize: 13 }}>Integrity summary not available.</div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}