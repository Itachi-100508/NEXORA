import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download, FileSearch, Printer } from 'lucide-react'
import { getResultById } from '../../services/mock'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import Breadcrumb from '../../components/ui/Breadcrumb'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import ResultPreview from '../../components/result/ResultPreview'
import Loader from '../../components/ui/Loader'
import ErrorState from '../../components/ui/ErrorState'

export default function ResultDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const docRef = useRef(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getResultById(id).then((r) => {
      setResult(r)
      setLoading(false)
    })
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
    </div>
  )
}