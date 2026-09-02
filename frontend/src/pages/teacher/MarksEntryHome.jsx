import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PenLine, ArrowRight } from 'lucide-react'
import { getAssignments } from '../../services/mock'
import PageHeader from '../../components/ui/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import StatCard from '../../components/ui/StatCard'
import StatusBadge from '../../components/ui/StatusBadge'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { ClipboardList, Timer, RefreshCw } from 'lucide-react'

export default function MarksEntryHome() {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAssignments({}).then((res) => {
      setData(res.data)
      setLoading(false)
    })
  }, [])

  const actionable = useMemo(
    () => data.filter((a) => ['DRAFT', 'PENDING', 'REJECTED'].includes(a.status)),
    [data],
  )

  return (
    <div>
      <PageHeader title="Marks Entry" subtitle="Select an assignment to begin or continue entering marks." />

      <div className="grid grid-3" style={{ marginBottom: 20 }}>
        <StatCard label="Assignments Ready" value={actionable.length} icon={PenLine} variant="primary" index={0} />
        <StatCard label="Pending Entry" value={data.filter((a) => ['DRAFT', 'PENDING'].includes(a.status)).length} icon={Timer} variant="warning" index={1} />
        <StatCard label="Needs Correction" value={data.filter((a) => a.status === 'REJECTED').length} icon={RefreshCw} variant="danger" index={2} />
      </div>

      {loading ? (
        <div className="grid grid-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} padded>
              <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 14, width: '80%' }} />
            </Card>
          ))}
        </div>
      ) : actionable.length ? (
        <div className="grid grid-3">
          {actionable.map((a) => (
            <Card key={a.id} padded style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="flex justify-between items-center">
                <Badge variant="primary">{a.subject}</Badge>
                <StatusBadge status={a.status} />
              </div>
              <div>
                <div className="cell-main" style={{ fontSize: 14 }}>{a.exam}</div>
                <div className="cell-sub">{a.className} · {a.academicYear}</div>
              </div>
              <div className="muted" style={{ fontSize: 13 }}>{a.totalStudents} students</div>
              <Button onClick={() => navigate(`/teacher/marks/${a.id}`)} style={{ marginTop: 'auto' }}>
                <PenLine size={16} /> Enter Marks <ArrowRight size={15} />
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <Card padded>
          <EmptyState icon={ClipboardList} title="No assignments to enter marks" description="All assignments have been submitted. Check your assignments page." />
        </Card>
      )}
    </div>
  )
}