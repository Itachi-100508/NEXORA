import { useEffect, useState } from 'react'
import { Check, ClipboardList, Eye, X } from 'lucide-react'
import { getRevaluationRequests, decideRevaluation } from '../../services/mock'
import PageHeader from '../../components/ui/PageHeader'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import StatusBadge from '../../components/ui/StatusBadge'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import StatusTimeline from '../../components/ui/StatusTimeline'
import { formatDateTime } from '../../utils/helpers'

export default function AdminRevaluations() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => getRevaluationRequests().then((res) => {
    setData(res.data)
    setLoading(false)
  })

  useEffect(() => {
    load()
  }, [])

  const decide = async (decision) => {
    setBusy(true)
    await decideRevaluation(selected.id, decision, note)
    setBusy(false)
    setSelected(null)
    setNote('')
    setLoading(true)
    load()
  }

  const columns = [
    { key: 'student', header: 'Student', render: (r) => <span className="cell-main">{r.studentName}</span> },
    { key: 'subject', header: 'Subject' },
    { key: 'marks', header: 'Current Marks', render: (r) => <Badge variant="secondary">{r.currentMarks}</Badge> },
    { key: 'semester', header: 'Sem', render: (r) => <span className="muted">Sem {r.semester}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      header: '',
      style: { textAlign: 'right' },
      render: (row) => (
        <button className="icon-btn" onClick={() => { setSelected(row); setNote('') }} aria-label="Review">
          <Eye size={16} />
        </button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Revaluation Requests" subtitle="Review student revaluation requests and record decisions." />

      <Card>
        <div className="card-body">
          <Table
            columns={columns}
            data={data}
            loading={loading}
            empty={<EmptyState icon={ClipboardList} title="No revaluation requests" description="Student revaluation requests will appear here for review." />}
          />
        </div>
      </Card>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Review — ${selected.subject}` : ''}
        size="lg"
      >
        {selected && (
          <div>
            <div className="doc-meta" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 18 }}>
              <div><div className="k">Student</div><div className="v">{selected.studentName}</div></div>
              <div><div className="k">Roll</div><div className="v">{selected.rollNumber}</div></div>
              <div><div className="k">Requested</div><div className="v">{formatDateTime(selected.requestedAt)}</div></div>
              <div><div className="k">Current Marks</div><div className="v">{selected.currentMarks}</div></div>
            </div>
            <div className="form-group">
              <label className="form-label">Student reason</label>
              <p className="muted" style={{ fontSize: 13.5, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)' }}>{selected.requestReason}</p>
            </div>
            <div className="form-group">
              <label className="form-label">Timeline</label>
              <StatusTimeline events={selected.timeline || []} currentStatus={selected.status === 'UNDER_REVIEW' ? 'under_review' : ''} />
            </div>
            <div className="form-group">
              <label className="form-label">Decision note</label>
              <textarea className="form-control" rows={3} placeholder="Add a note for the student…" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="flex" style={{ gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="soft-primary" onClick={() => decide('approve')} loading={busy}>
                <Check size={16} /> Approve
              </Button>
              <Button variant="danger-soft" onClick={() => decide('reject')} loading={busy}>
                <X size={16} /> Reject
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}