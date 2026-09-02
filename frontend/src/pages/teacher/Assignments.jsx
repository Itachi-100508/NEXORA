import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, PenLine, Eye, ArrowRight } from 'lucide-react'
import { getAssignments } from '../../services/mock'
import PageHeader from '../../components/ui/PageHeader'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import StatusBadge from '../../components/ui/StatusBadge'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import Filter from '../../components/ui/Filter'

const STATUS_ORDER = ['DRAFT', 'PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED']

export default function TeacherAssignments() {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')

  useEffect(() => {
    getAssignments({ status }).then((res) => {
      setData(res.data)
      setLoading(false)
    })
  }, [status])

  const totals = useMemo(() => {
    const t = { total: data.length, pending: 0, submitted: 0, approved: 0, rejected: 0 }
    data.forEach((a) => {
      if (['DRAFT', 'PENDING'].includes(a.status)) t.pending++
      if (a.status === 'SUBMITTED') t.submitted++
      if (a.status === 'APPROVED') t.approved++
      if (a.status === 'REJECTED') t.rejected++
    })
    return t
  }, [data])

  const columns = [
    {
      key: 'subject',
      header: 'Assignment',
      render: (r) => (
        <div>
          <div className="cell-main">{r.subject}</div>
          <div className="cell-sub">{r.exam}</div>
        </div>
      ),
    },
    { key: 'className', header: 'Class' },
    { key: 'academicYear', header: 'Academic Year', render: (r) => <span className="muted">{r.academicYear}</span> },
    { key: 'totalStudents', header: 'Students', render: (r) => <Badge variant="secondary">{r.totalStudents}</Badge> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      header: '',
      style: { textAlign: 'right' },
      render: (row) => (
        <div className="flex" style={{ gap: 6, justifyContent: 'flex-end' }}>
          {['DRAFT', 'PENDING', 'REJECTED'].includes(row.status) && (
            <Button size="sm" onClick={() => navigate(`/teacher/marks/${row.id}`)}>
              <PenLine size={14} /> Enter Marks
            </Button>
          )}
          <button className="icon-btn" onClick={() => navigate(`/teacher/assignments/${row.id}`)} title="View" aria-label="View">
            <Eye size={16} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="My Assignments" subtitle={`${totals.total} assignments · ${totals.pending} awaiting marks entry`} />

      <Card>
        <div className="card-body" style={{ paddingBottom: 8 }}>
          <Filter
            value={status}
            onChange={setStatus}
            options={STATUS_ORDER.map((s) => ({ value: s, label: s[0] + s.slice(1).toLowerCase() }))}
          />
        </div>
        <div className="card-body" style={{ paddingTop: 8 }}>
          <Table
            columns={columns}
            data={data}
            loading={loading}
            empty={
              <EmptyState
                icon={ClipboardList}
                title="No assignments yet"
                description="Assignments assigned to you will appear here. If none appear, you're all caught up!"
                action={<Button variant="outline" onClick={() => navigate('/teacher/dashboard')}><ArrowRight size={16} /> Go to Dashboard</Button>}
              />
            }
          />
        </div>
      </Card>
    </div>
  )
}