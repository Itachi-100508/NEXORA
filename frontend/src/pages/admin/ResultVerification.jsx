import { useEffect, useState } from 'react'
import { ShieldCheck, Check, X, Eye } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { getVerifications, approveResult, rejectResult } from '../../services/mock'
import PageHeader from '../../components/ui/PageHeader'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import StatusBadge from '../../components/ui/StatusBadge'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import Filter from '../../components/ui/Filter'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { formatDate } from '../../utils/helpers'

export default function ResultVerification() {
  const { toast } = useToast()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [reviewOpen, setReviewOpen] = useState(false)
  const [approveId, setApproveId] = useState(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [processingId, setProcessingId] = useState(null)
  const [selected, setSelected] = useState(null)

  const load = async () => {
    setLoading(true)
    const res = await getVerifications()
    setData(res.data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = status ? data.filter((r) => r.status === status) : data

  const openReview = (row) => {
    setSelected(row)
    setReviewOpen(true)
  }

  const handleApprove = async () => {
    setProcessingId(approveId)
    await approveResult(approveId, 'Checked totals and component marks.')
    setProcessingId(null)
    setApproveId(null)
    setReviewOpen(false)
    toast.success('Result approved', 'This result has been approved and is now ready to publish.')
    load()
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.warning('Reason required', 'Please provide a reason for rejection.')
      return
    }
    setProcessingId(selected?.id)
    await rejectResult(selected.id, rejectReason)
    setProcessingId(null)
    setRejectOpen(false)
    setReviewOpen(false)
    setRejectReason('')
    toast.error('Result rejected', 'The result was rejected and returned to the teacher.')
    load()
  }

  const canReview = (r) => ['SUBMITTED', 'UNDER_REVIEW'].includes(r.status)

  const columns = [
    {
      key: 'subject',
      header: 'Subject',
      render: (r) => (
        <div>
          <div className="cell-main">{r.subject}</div>
          <div className="cell-sub">{r.exam}</div>
        </div>
      ),
    },
    { key: 'className', header: 'Class' },
    { key: 'teacher', header: 'Teacher' },
    { key: 'students', header: 'Students', render: (r) => <Badge variant="secondary">{r.submissionCount ?? r.students}</Badge> },
    { key: 'submittedAt', header: 'Submitted', render: (r) => <span className="muted">{formatDate(r.submittedAt)}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      style: { textAlign: 'right' },
      render: (row) => (
        <div className="flex" style={{ gap: 6, justifyContent: 'flex-end' }}>
          <button className="icon-btn" onClick={() => openReview(row)} title="Review" aria-label="Review">
            <Eye size={16} />
          </button>
          {canReview(row) && (
            <>
              <button className="icon-btn" style={{ color: 'var(--success)' }} onClick={() => setApproveId(row.id)} title="Approve" aria-label="Approve">
                <Check size={16} />
              </button>
              <button className="icon-btn" style={{ color: 'var(--danger)' }} onClick={() => { setSelected(row); setRejectOpen(true) }} title="Reject" aria-label="Reject">
                <X size={16} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Result Verification"
        subtitle="Review component-wise marks and approve teacher submissions before publication."
      />

      <Card>
        <div className="card-body" style={{ paddingBottom: 8 }}>
          <Filter
            value={status}
            onChange={setStatus}
            options={[
              { value: 'UNDER_REVIEW', label: 'Under Review' },
              { value: 'SUBMITTED', label: 'Submitted' },
              { value: 'APPROVED', label: 'Approved' },
              { value: 'REJECTED', label: 'Rejected' },
            ]}
          />
        </div>
        <div className="card-body" style={{ paddingTop: 8 }}>
          <Table
            columns={columns}
            data={filtered}
            loading={loading}
            empty={<EmptyState icon={ShieldCheck} title="No results to verify" description="Submitted results from teachers will appear here for review." />}
          />
        </div>
      </Card>

      <Modal open={reviewOpen} onClose={() => setReviewOpen(false)} title="Review Submission" size="lg">
        {selected && (
          <div>
            <div className="grid grid-2" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 18 }}>
              <div className="detail-row"><span className="k">Subject</span><span className="v">{selected.subject}</span></div>
              <div className="detail-row"><span className="k">Exam</span><span className="v">{selected.exam}</span></div>
              <div className="detail-row"><span className="k">Class</span><span className="v">{selected.className}</span></div>
              <div className="detail-row"><span className="k">Teacher</span><span className="v">{selected.teacher}</span></div>
              <div className="detail-row"><span className="k">Students</span><span className="v">{selected.submissionCount ?? selected.students}</span></div>
              <div className="detail-row"><span className="k">Status</span><StatusBadge status={selected.status} /></div>
            </div>

            {selected.marks?.length > 0 && (
              <div className="table-wrap" style={{ marginBottom: 18, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                <table className="table marks-table">
                  <thead>
                    <tr>
                      <th>Roll</th>
                      <th>Student</th>
                      <th className="col-marks">Internal</th>
                      <th className="col-marks">Theory</th>
                      <th className="col-marks">Practical</th>
                      <th className="col-marks">Total</th>
                      <th>Grade</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.marks.map((m, i) => (
                      <tr key={i}>
                        <td className="muted">{m.rollNumber}</td>
                        <td><span className="cell-main">{m.studentName}</span></td>
                        <td>{m.internal ?? '—'}</td>
                        <td>{m.theory ?? '—'}</td>
                        <td>{m.practical ?? '—'}</td>
                        <td><strong>{m.total}</strong></td>
                        <td><Badge variant="primary">{m.grade}</Badge></td>
                        <td><Badge variant={m.pass ? 'success' : 'danger'}>{m.pass ? 'Pass' : 'Fail'}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex" style={{ gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="danger-soft" onClick={() => setRejectOpen(true)} disabled={!canReview(selected)}>
                <X size={16} /> Reject
              </Button>
              <Button variant="success" onClick={() => setApproveId(selected.id)} disabled={!canReview(selected)}>
                <Check size={16} /> Approve
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(approveId)}
        title="Approve this result?"
        description="Component marks and totals look correct. The result will be marked approved and become available for publication."
        confirmLabel="Approve Result"
        variant="success"
        loading={processingId === approveId}
        onCancel={() => setApproveId(null)}
        onConfirm={handleApprove}
      />

      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject Result" size="sm">
        <div className="form-group">
          <label className="form-label">
            Reason for rejection<span className="req">*</span>
          </label>
          <textarea
            className="form-control"
            rows={4}
            placeholder="Describe the issue so the teacher can correct and resubmit…"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </div>
        <div className="flex justify-between" style={{ gap: 10 }}>
          <Button variant="ghost" onClick={() => setRejectOpen(false)} disabled={Boolean(processingId)}>Cancel</Button>
          <Button variant="danger" onClick={handleReject} loading={processingId === selected?.id}>
            Reject Result
          </Button>
        </div>
      </Modal>
    </div>
  )
}