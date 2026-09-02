import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Download, Printer } from 'lucide-react'
import { getMyResults } from '../../services/mock'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import PageHeader from '../../components/ui/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonBlock } from '../../components/ui/Skeleton'

export default function Marksheet() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyResults().then((res) => {
      setData(res.data)
      setLoading(false)
    })
  }, [])

  const download = () => toast.info('Preparing marksheet', 'Download will begin shortly.')

  return (
    <div>
      <PageHeader title="Marksheet" subtitle={`Download or print official marksheets for ${user?.name}.`} />

      {loading ? (
        <Card padded><SkeletonBlock rows={4} height={16} /></Card>
      ) : data.length ? (
        <Card>
          <div className="card-body" style={{ padding: '12px 22px' }}>
            {data.map((r, i) => (
              <div
                key={r.id}
                className="flex items-center justify-between"
                style={{ padding: '16px 4px', borderBottom: i < data.length - 1 ? '1px solid var(--border)' : 'none', flexWrap: 'wrap', gap: 12 }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>Semester {r.semester} Marksheet</div>
                  <div className="muted" style={{ fontSize: 12.5 }}>{r.academicYear} · {r.percentage}% · CGPA {r.cgpa}</div>
                </div>
                <div className="flex" style={{ gap: 8, flexWrap: 'wrap' }}>
                  <Button size="sm" variant="outline" onClick={() => navigate(`/student/marksheet/${r.id}`)}>
                    <FileText size={14} /> Open
                  </Button>
                  <Button size="sm" variant="outline" onClick={download}>
                    <Download size={14} /> PDF
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => window.print()}>
                    <Printer size={14} /> Print
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card padded>
          <EmptyState icon={FileText} title="No marksheets available" description="Published results will be available for download here." />
        </Card>
      )}
    </div>
  )
}