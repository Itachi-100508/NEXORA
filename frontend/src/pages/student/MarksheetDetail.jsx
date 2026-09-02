import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Download, ExternalLink, Printer } from 'lucide-react'
import { getResultById } from '../../services/mock'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import Breadcrumb from '../../components/ui/Breadcrumb'
import Button from '../../components/ui/Button'
import ResultPreview from '../../components/result/ResultPreview'
import Loader from '../../components/ui/Loader'
import ErrorState from '../../components/ui/ErrorState'

export default function MarksheetDetail() {
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
  if (!result) return <ErrorState message="Marksheet not found" onRetry={() => navigate('/student/marksheet')} />

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Marksheet', to: '/student/marksheet' },
          { label: `Semester ${result.semester}` },
        ]}
      />

      <div className="page-header no-print">
        <div>
          <h1>Marksheet — Semester {result.semester}</h1>
          <div className="sub">{result.academicYear} · official exam document</div>
        </div>
        <div className="page-actions">
          <Button variant="outline" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</Button>
          <Button variant="outline" onClick={() => toast.info('Preparing marksheet', 'Your PDF download will begin shortly.')}><Download size={16} /> PDF</Button>
          <Button onClick={() => window.print()}><Printer size={16} /> Print</Button>
        </div>
      </div>

      <ResultPreview result={result} summary={{ name: user?.name, rollNumber: user?.rollNumber }} printerRef={docRef} />

      <div className="flex items-center gap-2 muted no-print" style={{ marginTop: 16, fontSize: 12.5 }} list="sm">
        <ExternalLink size={14} /> Verify using ID{' '}
        <span style={{ fontWeight: 700 }}>{result.verificationId}</span> at the public{' '}
        <Link to="/verify-result">result verification</Link> page.
      </div>
    </div>
  )
}