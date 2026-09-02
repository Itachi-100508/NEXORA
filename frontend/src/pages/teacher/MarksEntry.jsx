import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, CheckCircle2, ClipboardList, Save, Search, Send, Users } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { getAssignmentById, getAssignmentStudents, saveMarksDraft, submitMarks, gradeForScore } from '../../services/mock'
import Breadcrumb from '../../components/ui/Breadcrumb'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import StatusBadge from '../../components/ui/StatusBadge'
import Progress from '../../components/ui/Progress'
import Loader from '../../components/ui/Loader'
import ErrorState from '../../components/ui/ErrorState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { cn } from '../../utils/helpers'

function useMarksEntry(assignmentId) {
  const [assignment, setAssignment] = useState(null)
  const [students, setStudents] = useState([])
  const [marks, setMarks] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const assignment = await getAssignmentById(assignmentId)
      if (!assignment) {
        setError('Assignment not found')
        return
      }
      const roster = await getAssignmentStudents(assignmentId)
      const initial = {}
      roster.forEach((s) => {
        initial[s.id] = {
          internal: s.internal !== undefined && s.internal !== '' ? Number(s.internal) : '',
          theory: s.theory !== undefined && s.theory !== '' ? Number(s.theory) : '',
          practical: s.practical !== undefined && s.practical !== '' ? Number(s.practical) : '',
        }
      })
      setAssignment(assignment)
      setStudents(roster)
      setMarks(initial)
    } catch (e) {
      setError(e.message || 'Unable to load assignment')
    } finally {
      setLoading(false)
    }
  }, [assignmentId])

  useEffect(() => {
    load()
  }, [load])

  return { assignment, students, marks, setMarks, loading, error }
}

export default function MarksEntry() {
  const { assignmentId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { assignment, students, marks, setMarks, loading, error } = useMarksEntry(assignmentId)

  const [search, setSearch] = useState('')
  const [filterTab, setFilterTab] = useState('all') // 'all' | 'entered' | 'missing' | 'invalid'
  const [submitOpen, setSubmitOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const inputRefs = useRef({})

  const fields = assignment
    ? [
        { key: 'internal', label: 'Internal', max: assignment.maxInternal, show: (assignment.maxInternal || 0) > 0 },
        { key: 'theory', label: 'Theory', max: assignment.maxTheory, show: (assignment.maxTheory || 0) > 0 },
        { key: 'practical', label: 'Practical', max: assignment.maxPractical, show: (assignment.maxPractical || 0) > 0 },
      ]
    : []
  const activeFields = fields.filter((f) => f.show)
  const maxTotal = assignment?.maxTotal || activeFields.reduce((a, f) => a + f.max, 0)

  const locked = assignment?.status === 'APPROVED'

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return students
    return students.filter((s) => s.name.toLowerCase().includes(q) || s.rollNumber.toLowerCase().includes(q))
  }, [students, search])

  const allRows = useMemo(() => {
    return filtered.map((s) => {
      const m = marks[s.id] || {}
      const errors = {}
      let fieldsFilled = 0
      activeFields.forEach((f) => {
        const v = m[f.key]
        if (v === '' || v === null || v === undefined) {
          errors[f.key] = 'Required'
        } else if (Number.isNaN(Number(v))) {
          errors[f.key] = 'Invalid'
        } else if (Number(v) < 0) {
          errors[f.key] = 'Min 0'
        } else if (Number(v) > f.max && f.show) {
          errors[f.key] = `Max ${f.max}`
        } else {
          fieldsFilled += 1
        }
      })
      const total = activeFields.reduce((sum, f) => sum + (Number(m[f.key]) || 0), 0)
      const grade = gradeForScore(total)
      const complete = fieldsFilled === activeFields.length
      const invalid = Object.keys(errors).length > 0
      return { student: s, marks: m, errors, total, grade, complete, invalid }
    })
  }, [filtered, marks, activeFields])

  const rows = useMemo(() => {
    if (filterTab === 'entered') return allRows.filter((r) => r.complete && !r.invalid)
    if (filterTab === 'missing') return allRows.filter((r) => !r.complete && !r.invalid)
    if (filterTab === 'invalid') return allRows.filter((r) => r.invalid)
    return allRows
  }, [allRows, filterTab])

  const enteredCount = allRows.filter((r) => r.complete && !r.invalid).length
  const invalidCount = allRows.filter((r) => r.invalid).length
  const missing = students.length - enteredCount
  const filledRows = allRows.filter((r) => Object.keys(r.marks).some((k) => activeFields.some((f) => f.key === k && r.marks[k] !== '')))
  const avg = filledRows.length ? Math.round(filledRows.reduce((a, r) => a + r.total, 0) / filledRows.length) : 0
  const passCount = filledRows.filter((r) => r.grade.pass).length
  const passPct = filledRows.length ? Math.round((passCount / filledRows.length) * 100) : 0
  const hasErrors = invalidCount > 0

  const handleChange = (id, key, raw) => {
    setDirty(true)
    setMarks((prev) => ({ ...prev, [id]: { ...prev[id], [key]: raw } }))
  }

  const buildPayload = () => {
    const payload = {}
    rows.forEach((r) => {
      if (r.complete) {
        payload[r.student.id] = {
          internal: Number(r.marks.internal) || 0,
          theory: Number(r.marks.theory) || 0,
          practical: Number(r.marks.practical) || 0,
        }
      }
    })
    return payload
  }

  const handleSaveDraft = async () => {
    setSaving(true)
    await saveMarksDraft(assignmentId, buildPayload())
    setSaving(false)
    setDirty(false)
    toast.success('Draft saved', 'Your marks draft has been saved. You can continue later.')
  }

  const handleSubmit = async () => {
    setSaving(true)
    await submitMarks(assignmentId, buildPayload())
    setSaving(false)
    setSubmitOpen(false)
    setDirty(false)
    toast.success('Marks submitted', 'Marks submitted and are now under admin review.')
    navigate('/teacher/submissions')
  }

  useEffect(() => {
    const beforeUnload = (e) => {
      if (dirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [dirty])

  if (loading) return <Loader />
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />

  const nextField = (id, key) => {
    const idx = rows.findIndex((r) => r.student.id === id)
    const fIdx = activeFields.findIndex((f) => f.key === key)
    if (fIdx < activeFields.length - 1) {
      inputRefs.current[`${id}:${activeFields[fIdx + 1].key}`]?.focus()
    } else if (rows[idx + 1]) {
      inputRefs.current[`${rows[idx + 1].student.id}:${activeFields[0].key}`]?.focus()
    }
  }

  const canSubmit = missing > 0 || hasErrors

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'My Assignments', to: '/teacher/assignments' },
          { label: `Marks Entry — ${assignment.subject}` },
        ]}
      />

      <div className="page-header">
        <div>
          <h1>Marks Entry</h1>
          <div className="sub">
            {assignment.exam} · {assignment.className} · {assignment.academicYear}
          </div>
        </div>
        <div className="page-actions">
          {locked && <StatusBadge status="APPROVED" />}
          <Button variant="outline" onClick={() => navigate('/teacher/assignments')}>
            <ArrowLeft size={16} /> Back
          </Button>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <Card padded>
          <div className="flex items-center" style={{ gap: 12 }}>
            <span className="stat-icon ic-primary"><Users size={20} /></span>
            <div>
              <div className="stat-label">Total Students</div>
              <div className="stat-value" style={{ fontSize: 22 }}>{students.length}</div>
            </div>
          </div>
        </Card>
        <Card padded>
          <div className="flex items-center" style={{ gap: 12 }}>
            <span className="stat-icon ic-success"><CheckCircle2 size={20} /></span>
            <div>
              <div className="stat-label">Complete / Invalid</div>
              <div className="stat-value" style={{ fontSize: 22 }}>{enteredCount} / {invalidCount}</div>
            </div>
          </div>
        </Card>
        <Card padded>
          <div className="flex items-center" style={{ gap: 12 }}>
            <span className="stat-icon ic-warning"><AlertTriangle size={20} /></span>
            <div>
              <div className="stat-label">Class Average</div>
              <div className="stat-value" style={{ fontSize: 22, color: 'var(--warning)' }}>{avg}%</div>
            </div>
          </div>
        </Card>
        <Card padded>
          <div className="flex items-center" style={{ gap: 12 }}>
            <span className="stat-icon ic-accent"><ClipboardList size={20} /></span>
            <div>
              <div className="stat-label">Pass Rate (entered)</div>
              <div className="stat-value" style={{ fontSize: 22 }}>{passPct}%</div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="card-header" style={{ flexWrap: 'wrap' }}>
          <div className="flex items-center" style={{ gap: 10, flexWrap: 'wrap' }}>
            <h3>Student Marks</h3>
            <Badge variant="muted">{assignment.subject}</Badge>
            <StatusBadge status={assignment.status} />
            <Badge variant="accent">Scheme: {activeFields.map((f) => `${f.label} ${f.max}`).join(' + ')} = {maxTotal}</Badge>
          </div>
          <div className="search-bar" style={{ maxWidth: 280 }}>
            <span className="search-icon"><Search size={16} /></span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students…" disabled={locked} />
          </div>
        </div>

        <div className="marks-entry-toolbar">
          <div className="flex items-center" style={{ gap: 6 }}>
            <button
              type="button"
              className={cn('page-btn', filterTab === 'all' && 'active')}
              onClick={() => setFilterTab('all')}
              style={{ fontSize: 12, padding: '4px 10px', height: 'auto' }}
            >
              All ({students.length})
            </button>
            <button
              type="button"
              className={cn('page-btn', filterTab === 'entered' && 'active')}
              onClick={() => setFilterTab('entered')}
              style={{ fontSize: 12, padding: '4px 10px', height: 'auto' }}
            >
              Entered ({enteredCount})
            </button>
            <button
              type="button"
              className={cn('page-btn', filterTab === 'missing' && 'active')}
              onClick={() => setFilterTab('missing')}
              style={{ fontSize: 12, padding: '4px 10px', height: 'auto' }}
            >
              Missing ({missing})
            </button>
            {invalidCount > 0 && (
              <button
                type="button"
                className={cn('page-btn', filterTab === 'invalid' && 'active')}
                onClick={() => setFilterTab('invalid')}
                style={{ fontSize: 12, padding: '4px 10px', height: 'auto', color: 'var(--danger)' }}
              >
                Invalid ({invalidCount})
              </button>
            )}
          </div>
          <span className="marks-chip" style={{ flex: 1, minWidth: 140, padding: '8px 0', border: 'none', background: 'transparent' }}>
            <Progress value={(enteredCount / Math.max(students.length, 1)) * 100} color={hasErrors ? 'danger' : 'success'} />
          </span>
          <span className="muted" style={{ fontSize: 12.5 }}>
            ⏎ Enter / Tab moves to next cell
          </span>
        </div>

        <div className="table-wrap">
          <table className="table marks-table">
            <thead>
              <tr>
                <th>Roll No.</th>
                <th>Student</th>
                {activeFields.map((f) => (
                  <th key={f.key} className="col-marks">{f.label} <span className="muted">/{f.max}</span></th>
                ))}
                <th className="col-marks">Total</th>
                <th>Grade</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.student.id} className={cn(r.invalid && 'row-invalid')}>
                  <td className="muted">{r.student.rollNumber}</td>
                  <td>
                    <div className="cell-main">{r.student.name}</div>
                  </td>
                  {activeFields.map((f) => {
                    const err = r.errors[f.key]
                    return (
                      <td key={f.key} className="col-marks">
                        <div className="marks-cell">
                          <input
                            ref={(el) => { inputRefs.current[`${r.student.id}:${f.key}`] = el }}
                            type="number"
                            min={0}
                            max={f.max}
                            inputMode="numeric"
                            className={cn('form-control marks-input', err && 'has-error')}
                            placeholder="—"
                            value={r.marks[f.key] === '' ? '' : r.marks[f.key].toString()}
                            onChange={(e) => handleChange(r.student.id, f.key, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                nextField(r.student.id, f.key)
                              }
                            }}
                            disabled={locked}
                            aria-label={`${f.label} marks for ${r.student.name}`}
                          />
                          {err && <span className="err">{err}</span>}
                        </div>
                      </td>
                    )
                  })}
                  <td className="col-marks">
                    <strong className={cn(!r.complete && !r.invalid ? 'muted' : '', !r.grade.pass && !r.invalid && 'badge-danger')}>
                      {r.complete ? r.total : '—'}
                    </strong>
                  </td>
                  <td>
                    {r.complete ? <Badge variant={r.grade.pass ? 'success' : 'danger'}>{r.grade.grade}</Badge> : <Badge variant="muted">—</Badge>}
                  </td>
                  <td>
                    {r.complete && !r.invalid ? (
                      <Badge variant="success" dot>Entered</Badge>
                    ) : r.invalid ? (
                      <Badge variant="danger" dot>Invalid</Badge>
                    ) : (
                      <Badge variant="muted">Not entered</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div className="muted" style={{ fontSize: 13 }}>
            {locked ? (
              <span style={{ color: 'var(--success)' }}>Approved — marks are locked from editing.</span>
            ) : hasErrors ? (
              <span style={{ color: 'var(--danger)' }}>Some marks are invalid. Fix highlighted fields before submitting.</span>
            ) : missing > 0 ? (
              <span>{missing} students missing marks.</span>
            ) : (
              <span style={{ color: 'var(--success)' }}>All marks entered and valid. Ready to submit.</span>
            )}
          </div>
          <div className="flex" style={{ gap: 10 }}>
            <Button variant="outline" onClick={handleSaveDraft} loading={saving} disabled={!dirty || locked}>
              <Save size={16} /> Save Draft
            </Button>
            <Button
              variant="success"
              onClick={() => setSubmitOpen(true)}
              disabled={canSubmit || locked}
              title={locked ? 'Already approved' : canSubmit ? 'All marks must be entered and valid before submitting.' : 'Submit for review'}
            >
              <Send size={16} /> Submit for Review
            </Button>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        open={submitOpen}
        title="Submit all marks?"
        description={`${enteredCount} of ${students.length} students will be submitted for admin review. Total and grade will be computed from your component marks.`}
        confirmLabel="Submit Marks"
        variant="success"
        loading={saving}
        onCancel={() => setSubmitOpen(false)}
        onConfirm={handleSubmit}
      />
    </div>
  )
}