import { useEffect, useState } from 'react'
import { XCircle, PenLine } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getSubmissions } from '../../services/mock'
import PageHeader from '../../components/ui/PageHeader'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate } from '../../utils/helpers'

export default function TeacherRejectedMarks() {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSubmissions().then((res) => {
      setData(res.data.filter((r) => r.status === 'REJECTED'))
      setLoading(false)
    })
  }, [])

  const columns = [
    { key: 'subject', header: 'Subject', render: (r) => <span className="cell-main">{r.subject}</span> },
    { key: 'className', header: 'Class' },
    { key: 'exam', header: 'Exam' },
    { key: 'rejectedAt', header: 'Rejected', render: (r) => <span className="muted">{formatDate(r.submittedAt)}</span> },
    {
      key: 'reason',
      header: 'Reason',
      render: () => <Badge variant="danger">Review required</Badge>,
    },
    {
      key: 'actions',
      header: '',
      style: { textAlign: 'right' },
      render: (row) => (
        <Button size="sm" variant="soft-primary" onClick={() => navigate(`/teacher/marks/${row.assignmentId}`)}>
          <PenLine size={14} /> Correct & Resubmit
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Rejected Marks" subtitle="Resubmit corrections for rejected submissions." />
      <Card>
        <div className="card-body">
          <Table columns={columns} data={data} loading={loading} empty={<EmptyState icon={XCircle} title="No rejected submissions" description="Great job! None of your submissions have been rejected." />} />
        </div>
      </Card>
    </div>
  )
}