import { useEffect, useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { getAssignments } from '../../services/mock'
import PageHeader from '../../components/ui/PageHeader'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import StatusBadge from '../../components/ui/StatusBadge'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import Filter from '../../components/ui/Filter'

const STATUSES = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
]

export default function AdminAssignments() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')

  useEffect(() => {
    let mounted = true
    getAssignments({ status }).then((res) => {
      if (mounted) {
        setData(res.data)
        setLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [status])

  const columns = [
    { key: 'subject', header: 'Subject', render: (r) => <span className="cell-main">{r.subject}</span> },
    { key: 'exam', header: 'Exam' },
    { key: 'className', header: 'Class' },
    { key: 'academicYear', header: 'Academic Year', render: (r) => <span className="muted">{r.academicYear}</span> },
    { key: 'totalStudents', header: 'Students', render: (r) => <Badge variant="secondary">{r.totalStudents}</Badge> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ]

  return (
    <div>
      <PageHeader title="Assignments" subtitle="Monitor all teacher-exam-subject assignments across the institution." />
      <Card>
        <div className="card-body" style={{ paddingBottom: 8 }}>
          <Filter value={status} onChange={setStatus} options={STATUSES} />
        </div>
        <div className="card-body" style={{ paddingTop: 8 }}>
          <Table
            columns={columns}
            data={data}
            loading={loading}
            empty={<EmptyState icon={ClipboardList} title="No assignments" description="Assignments created for exams will appear here." />}
          />
        </div>
      </Card>
    </div>
  )
}
