import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { History as HistoryIcon, ChevronRight } from 'lucide-react'
import { getMyResults } from '../../services/mock'
import PageHeader from '../../components/ui/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonBlock } from '../../components/ui/Skeleton'

export default function ResultHistory() {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyResults().then((res) => {
      setData([...res.data].sort((a, b) => b.semester - a.semester))
      setLoading(false)
    })
  }, [])

  return (
    <div>
      <PageHeader title="Result History" subtitle="A timeline of all your published results across semesters." />

      <Card>
        <div className="card-body" style={{ padding: '12px 22px' }}>
          {loading ? (
            <SkeletonBlock rows={4} height={16} />
          ) : data.length ? (
            data.map((r, i) => (
              <div
                key={r.id}
                className="flex items-center justify-between"
                style={{ padding: '16px 4px', borderBottom: i < data.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}
                onClick={() => navigate(`/student/results/${r.id}`)}
              >
                <div className="flex items-center" style={{ gap: 16 }}>
                  <div className="sem-orb">S{r.semester}</div>
                  <div>
                    <div style={{ fontWeight: 700 }}>Semester {r.semester}</div>
                    <div className="muted" style={{ fontSize: 12.5 }}>{r.academicYear}</div>
                  </div>
                </div>
                <div className="flex items-center" style={{ gap: 16 }}>
                  <Badge variant="secondary">{r.percentage}%</Badge>
                  <Badge variant="primary">CGPA {r.cgpa}</Badge>
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/student/marksheet/${r.id}`) }}>Marksheet</Button>
                  <StatusBadge status={r.status} />
                  <ChevronRight size={16} className="muted" />
                </div>
              </div>
            ))
          ) : (
            <EmptyState icon={HistoryIcon} title="No result history" description="Published results will appear here chronologically." />
          )}
        </div>
      </Card>
    </div>
  )
}