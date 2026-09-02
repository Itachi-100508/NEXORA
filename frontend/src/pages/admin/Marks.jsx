import { useEffect, useState } from 'react'
import { Gauge } from 'lucide-react'
import { getAssignments } from '../../services/mock'
import PageHeader from '../../components/ui/PageHeader'
import Card from '../../components/ui/Card'
import StatCard from '../../components/ui/StatCard'
import Table from '../../components/ui/Table'
import StatusBadge from '../../components/ui/StatusBadge'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { ClipboardList, Timer, CheckCircle2, XCircle } from 'lucide-react'

export default function AdminMarks() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAssignments({}).then((res) => {
      setData(res.data)
      setLoading(false)
    })
  }, [])

  const counts = {
    total: data.length,
    pending: data.filter((a) => ['DRAFT', 'PENDING'].includes(a.status)).length,
    submitted: data.filter((a) => a.status === 'SUBMITTED').length,
    approved: data.filter((a) => a.status === 'APPROVED').length,
    rejected: data.filter((a) => a.status === 'REJECTED').length,
  }

  const columns = [
    { key: 'subject', header: 'Subject', render: (r) => <span className="cell-main">{r.subject}</span> },
    { key: 'className', header: 'Class' },
    { key: 'exam', header: 'Exam' },
    { key: 'totalStudents', header: 'Students', render: (r) => <Badge variant="secondary">{r.totalStudents}</Badge> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ]

  return (
    <div>
      <PageHeader title="Marks Monitoring" subtitle="Track marks entry progress across all assignments." />

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <StatCard label="Total Assignments" value={counts.total} icon={ClipboardList} variant="primary" index={0} />
        <StatCard label="Pending Entry" value={counts.pending} icon={Timer} variant="warning" index={1} />
        <StatCard label="Submitted" value={counts.submitted} icon={CheckCircle2} variant="accent" index={2} />
        <StatCard label="Rejected" value={counts.rejected} icon={XCircle} variant="danger" index={3} />
      </div>

      <Card>
        <div className="card-header">
          <h3>Assignment Progress</h3>
        </div>
        <div className="card-body">
          <Table
            columns={columns}
            data={data}
            loading={loading}
            empty={<EmptyState icon={Gauge} title="No assignment data" description="Assignments will appear here as they are created." />}
          />
        </div>
      </Card>
    </div>
  )
}