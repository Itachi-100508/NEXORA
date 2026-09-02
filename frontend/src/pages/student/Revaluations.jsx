import { useEffect, useState } from 'react'
import { FileSearch } from 'lucide-react'
import { getMyRevaluations, requestRevaluation } from '../../services/mock'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import PageHeader from '../../components/ui/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import StatusBadge from '../../components/ui/StatusBadge'
import StatusTimeline from '../../components/ui/StatusTimeline'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonBlock } from '../../components/ui/Skeleton'
import { formatDate } from '../../utils/helpers'

export default function StudentRevaluations() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => getMyRevaluations(21).then((res) => {
    setData(res.data)
    setLoading(false)
  })

  useEffect(() => {
    load()
  }, [])

  const submit = async () => {
    if (!subject || !reason.trim()) return
    setBusy(true)
    await requestRevaluation({
      resultId: 73,
      studentId: 21,
      studentName: user?.name,
      rollNumber: user?.rollNumber,
      semester: user?.semester || 3,
      subject,
      currentMarks: 0,
      reason,
    })
    setBusy(false)
    setOpen(false)
    setSubject('')
    setReason('')
    toast.success('Request submitted', 'Your revaluation request has been queued for review.')
    load()
  }

  return (
    <div>
      <PageHeader
        title="Revaluation"
        subtitle="Request re-evaluation of a subject within 7 days of result publication."
        actions={<Button onClick={() => setOpen(true)}><FileSearch size={16} /> Request Revaluation</Button>}
      />

      {loading ? (
        <Card padded><SkeletonBlock rows={4} height={16} /></Card>
      ) : data.length ? (
        <div className="grid grid-2-wide">
          <div className="flex flex-col" style={{ gap: 16 }}>
            {data.map((r) => (
              <Card key={r.id}>
                <div className="card-body">
                  <div className="flex justify-between items-center" style={{ marginBottom: 10 }}>
                    <div className="cell-main">{r.subject}</div>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="muted" style={{ fontSize: 12.5, marginBottom: 12 }}>
                    Requested {formatDate(r.requestedAt)} · {r.studentName}
                  </div>
                  <p className="muted" style={{ fontSize: 13.5, background: 'var(--surface-2)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', marginBottom: 14 }}>
                    {r.requestReason}
                  </p>
                  {r.decisionNote && <Badge variant="success">Decision: {r.decisionNote}</Badge>}
                  {r.status === 'UNDER_REVIEW' && <Badge variant="info">In review</Badge>}
                </div>
              </Card>
            ))}
          </div>
          <Card>
            <div className="card-header"><h3>Status overview</h3></div>
            <div className="card-body">
              <StatusTimeline
                events={[
                  { step: 'requested', label: 'Requested', note: 'Request received', at: data[0]?.requestedAt },
                  { step: 'under_review', label: 'Under review', note: 'Second examiner assigned' },
                  { step: 'approved', label: 'Decision', note: 'Approved or rejected' },
                  { step: 'completed', label: 'Completed', note: 'Marksheet updated' },
                ]}
                currentStatus="under_review"
              />
            </div>
          </Card>
        </div>
      ) : (
        <Card padded>
          <EmptyState icon={FileSearch} title="No revaluation requests" description="Request a revaluation from your latest result within 7 days of publication." />
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Request Revaluation" size="sm">
        <div className="form-group">
          <label className="form-label">Subject <span className="req">*</span></label>
          <select className="form-control" value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="">Select subject</option>
            <option value="Data Structures">Data Structures</option>
            <option value="Database Systems">Database Systems</option>
            <option value="Operating Systems">Operating Systems</option>
            <option value="Computer Networks">Computer Networks</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Reason <span className="req">*</span></label>
          <textarea className="form-control" rows={4} placeholder="Explain why you're requesting a re-evaluation…" value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="form-hint">Revaluation fee of ₹500 applies per subject. Decisions take up to 5 working days.</div>
        </div>
        <div className="flex" style={{ gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} loading={busy} disabled={!subject || !reason.trim()}>Submit request</Button>
        </div>
      </Modal>
    </div>
  )
}