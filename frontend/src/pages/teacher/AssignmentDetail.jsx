import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, PenLine, RefreshCw, Users } from 'lucide-react'
import { getAssignmentById, getAssignmentStudents } from '../../services/mock'
import Breadcrumb from '../../components/ui/Breadcrumb'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import StatusBadge from '../../components/ui/StatusBadge'
import StatusTimeline from '../../components/ui/StatusTimeline'
import Loader from '../../components/ui/Loader'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import { formatDateTime } from '../../utils/helpers'

const STATUS_STEPS = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED']

export default function AssignmentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [assignment, setAssignment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getAssignmentById(id).then((a) => {
      if (!a) setError('Assignment not found.')
      setAssignment(a)
      setLoading(false)
    })
  }, [id])

  if (loading) return <Loader />
  if (error || !assignment) return <ErrorState message={error} onRetry={() => navigate('/teacher/assignments')} />

  const canEnter = ['DRAFT', 'PENDING', 'REJECTED'].includes(assignment.status)
  const activeIndex = STATUS_STEPS.indexOf(assignment.status)

  const timelineEvents = [
    { step: 'DRAFT', label: 'Draft', note: 'Assignment created', at: assignment.createdAt },
    { step: 'SUBMITTED', label: 'Submitted', note: 'Marks submitted by you', at: assignment.submittedAt },
    { step: 'UNDER_REVIEW', label: 'Under review', note: 'Verification by exam cell' },
    assignment.status === 'REJECTED'
      ? { step: 'REJECTED', label: 'Rejected', note: assignment.rejectionReason || 'Review required', at: assignment.submittedAt }
      : { step: 'APPROVED', label: 'Approved', note: 'Final marks locked', at: assignment.submittedAt },
  ].filter(Boolean)

  const scheme = [
    { key: 'maxInternal', label: 'Internal' },
    { key: 'maxTheory', label: 'Theory' },
    { key: 'maxPractical', label: 'Practical' },
  ].filter((s) => (assignment[s.key] || 0) > 0)

  return (
    <div>
      <Breadcrumb items={[{ label: 'My Assignments', to: '/teacher/assignments' }, { label: assignment.subject }]} />

      <div className="page-header">
        <div>
          <h1>{assignment.subject}</h1>
          <div className="sub">{assignment.exam} · {assignment.className}</div>
        </div>
        <div className="page-actions">
          <Button variant="outline" onClick={() => navigate('/teacher/assignments')}><ArrowLeft size={16} /> Back</Button>
          {canEnter && (
            <Button onClick={() => navigate(`/teacher/marks/${assignment.id}`)}>
              <PenLine size={16} /> {assignment.status === 'REJECTED' ? 'Correct & Resubmit' : 'Enter Marks'}
            </Button>
          )}
        </div>
      </div>

      {assignment.status === 'REJECTED' && assignment.rejectionReason && (
        <div style={{ padding: '14px 18px', borderRadius: 'var(--radius-md)', background: 'var(--danger-light)', color: 'var(--danger)', marginBottom: 20, fontWeight: 500 }}>
          <RefreshCw size={16} style={{ marginRight: 8, verticalAlign: '-3px' }} />
          Rejection reason: {assignment.rejectionReason}
        </div>
      )}

      <div className="grid grid-2-equal" style={{ marginBottom: 20 }}>
        <Card padded>
          <h3 className="card-title mb-4">Assignment details</h3>
          <div style={{ display: 'grid', gap: 6 }}>
            <div className="detail-row"><span className="k">Class</span><span className="v">{assignment.className}</span></div>
            <div className="detail-row"><span className="k">Academic Year</span><span className="v">{assignment.academicYear}</span></div>
            <div className="detail-row"><span className="k">Total Students</span><span className="v">{assignment.totalStudents}</span></div>
            <div className="detail-row"><span className="k">Marking Scheme</span><span className="v">{scheme.map((s) => `${s.label} ${assignment[s.key]}`).join(' + ')} = {assignment.maxTotal}</span></div>
            <div className="detail-row"><span className="k">Status</span><StatusBadge status={assignment.status} /></div>
          </div>
          {assignment.submittedAt && (
            <div className="muted" style={{ fontSize: 12.5, marginTop: 14 }}>Submitted {formatDateTime(assignment.submittedAt)}</div>
          )}
        </Card>

        <Card padded>
          <h3 className="card-title mb-4">Status timeline</h3>
          <StatusTimeline events={timelineEvents} currentStatus={assignment.status === 'UNDER_REVIEW' ? 'UNDER_REVIEW' : ''} />
        </Card>
      </div>

      <Card>
        <div className="card-header">
          <h3>Mark Submission Progress</h3>
          <Badge variant={assignment.status === 'DRAFT' ? 'muted' : assignment.status === 'REJECTED' ? 'danger' : assignment.status === 'APPROVED' ? 'success' : 'warning'}>
            {activeIndex >= 0 ? `${activeIndex}/${STATUS_STEPS.length - 1} steps done` : '—'}
          </Badge>
        </div>
        <div className="card-body">
          <AssignmentRoster assignmentId={assignment.id} status={assignment.status} />
        </div>
      </Card>
    </div>
  )
}

function AssignmentRoster({ assignmentId, status }) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAssignmentStudents(assignmentId).then((roster) => {
      setStudents(roster)
      setLoading(false)
    })
  }, [assignmentId])

  if (loading) return <Loader sm />
  if (!students.length) return <EmptyState icon={Users} title="No students enrolled" />

  const submitted = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'].includes(status)
  const hasMarks = students.some((s) => (s.internal !== '' && s.internal !== undefined) || (s.theory !== '' && s.theory !== undefined))

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Roll No.</th>
            <th>Student</th>
            {submitted && hasMarks && <th>Internal</th>}
            {submitted && hasMarks && <th>Theory</th>}
            {submitted && hasMarks && <th>Practical</th>}
            {submitted && hasMarks && <th>Total</th>}
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => {
            const internal = s.internal !== '' && s.internal !== undefined ? Number(s.internal) : null
            const theory = s.theory !== '' && s.theory !== undefined ? Number(s.theory) : null
            const practical = s.practical !== '' && s.practical !== undefined ? Number(s.practical) : null
            const hasAny = internal !== null || theory !== null || practical !== null
            const total = (internal || 0) + (theory || 0) + (practical || 0)
            return (
              <tr key={s.id}>
                <td className="muted">{s.rollNumber}</td>
                <td><span className="cell-main">{s.name}</span></td>
                {submitted && hasMarks && <td>{internal ?? '—'}</td>}
                {submitted && hasMarks && <td>{theory ?? '—'}</td>}
                {submitted && hasMarks && <td>{practical ?? '—'}</td>}
                {submitted && hasMarks && <td><strong>{hasAny ? total : '—'}</strong></td>}
                <td>
                  {submitted && hasAny ? (
                    <Badge variant="success" dot>Entered</Badge>
                  ) : status === 'REJECTED' ? (
                    <Badge variant="danger" dot>Needs correction</Badge>
                  ) : (
                    <Badge variant="muted">Pending</Badge>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}