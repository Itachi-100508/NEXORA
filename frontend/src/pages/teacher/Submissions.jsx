import { useEffect, useState } from 'react'
import { Send, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getSubmissions } from '../../services/mock'
import PageHeader from '../../components/ui/PageHeader'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import StatusBadge from '../../components/ui/StatusBadge'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate } from '../../utils/helpers'

export default function TeacherSubmissions() {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSubmissions().then((res) => {
      setData(res.data)
      setLoading(false)
    })
  }, [])

  const columns = [
    { key: 'subject', header: 'Subject', render: (r) => <span className="cell-main">{r.subject}</span> },
    { key: 'className', header: 'Class' },
    { key: 'exam', header: 'Exam' },
    { key: 'submittedAt', header: 'Submitted', render: (r) => <span className="muted">{formatDate(r.submittedAt)}</span> },
    { key: 'students', header: 'Students', render: (r) => <Badge variant="secondary">{r.students}</Badge> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      header: '',
      style: { textAlign: 'right' },
      render: (row) => (
        <button className="icon-btn" onClick={() => navigate(`/teacher/assignments/${row.assignmentId}`)} title="View" aria-label="View">
          <Eye size={16} />
        </button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Submissions" subtitle="Track the status of your submitted marks." />
      <Card>
        <div className="card-body">
          <Table columns={columns} data={data} loading={loading} empty={<EmptyState icon={Send} title="No submissions yet" description="Marks you have submitted will appear here with their verification status." />} />
        </div>
      </Card>
    </div>
  )
}