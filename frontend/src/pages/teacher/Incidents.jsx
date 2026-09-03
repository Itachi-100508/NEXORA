import { useCallback, useEffect, useState } from 'react'
import { ShieldAlert, Send, Paperclip, FileText } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { incidentService, examDayService } from '../../services'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import { SkeletonBlock } from '../../components/ui/Skeleton'
import { formatDateTime } from '../../utils/helpers'

const TYPE_OPTIONS = ['Malpractice', 'Late Arrival', 'Technical Issue', 'Medical Issue', 'Attendance Issue', 'Other']
const SEVERITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical']
const statusVariant = {
  OPEN: 'primary',
  UNDER_REVIEW: 'warning',
  RESOLVED: 'success',
  REJECTED: 'danger',
}

export default function TeacherIncidents() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [items, setItems] = useState([])
  const [days, setDays] = useState([])
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [detail, setDetail] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    type: 'Other',
    severity: 'Medium',
    student: '',
    rollNumber: '',
    exam: '',
    examDayId: '',
    room: '',
    description: '',
    evidenceName: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [listRes, dayRes] = await Promise.allSettled([
        incidentService.getAll(),
        examDayService.getDays(),
      ])
      if (listRes.status === 'fulfilled') {
        const list = listRes.value.data || []
        setItems(list)
        setOffline(Boolean(listRes.value.offline))
      }
      if (dayRes.status === 'fulfilled') setDays(dayRes.value.data || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const set = (k) => (e) => {
    const v = e.target ? e.target.value : e
    setForm((f) => ({ ...f, [k]: v }))
  }

  const handleSubmit = async () => {
    if (!form.description.trim()) {
      toast.error('Description required', 'Please describe the incident.')
      return
    }
    setSubmitting(true)
    try {
      const res = await incidentService.create({ ...form, reportedBy: user?.name || 'Teacher' })
      if (res.data?.id) {
        toast.success('Incident reported', `Incident #${res.data.id} created (status OPEN).`)
        setShowForm(false)
        setForm({ type: 'Other', severity: 'Medium', student: '', rollNumber: '', exam: '', examDayId: '', room: '', description: '', evidenceName: '' })
        load()
      } else {
        toast.success('Incident reported', 'Your incident has been logged.')
      }
    } catch {
      toast.error('Could not report', 'An error occurred while submitting the incident.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} padded><SkeletonBlock rows={4} height={16} /></Card>
        ))}
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Incident Reporting"
        subtitle="Report examination incidents for review by the exam coordinator."
        actions={
          <>
            {offline && <Badge variant="warning" dot>Demo/Offline</Badge>}
            <Button onClick={() => setShowForm(true)}><ShieldAlert size={16} /> Report Incident</Button>
          </>
        }
      />

      <Card>
        <div className="card-header"><h3>My Incident Reports</h3></div>
        <div className="card-body">
          {items.length === 0 ? (
            <EmptyState icon={ShieldAlert} title="No incidents reported" description="Report an incident using the button above." />
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Severity</th>
                    <th>Student</th>
                    <th>Exam</th>
                    <th>Room</th>
                    <th>Date / Time</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.id}>
                      <td>#{i.id}</td>
                      <td>{i.type}</td>
                      <td>
                        <Badge variant={i.severity === 'Critical' ? 'danger' : i.severity === 'High' ? 'warning' : 'neutral'}>{i.severity}</Badge>
                      </td>
                      <td>{i.student}</td>
                      <td>{i.exam}</td>
                      <td>{i.room}</td>
                      <td className="muted" style={{ fontSize: 13 }}>{formatDateTime(i.timestamp)}</td>
                      <td><Badge variant={statusVariant[i.status] || 'neutral'}>{i.status}</Badge></td>
                      <td style={{ textAlign: 'right' }}>
                        <Button size="sm" variant="outline" onClick={() => setDetail(i)}>View</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Report an Incident" size="lg">
        <div className="card-body" style={{ padding: 0 }}>
          <div className="grid grid-2" style={{ gap: 12 }}>
            <Select label="Incident Type" value={form.type} onChange={set('type')}>
              {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
            <Select label="Severity" value={form.severity} onChange={set('severity')}>
              {SEVERITY_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <div className="grid grid-2" style={{ gap: 12 }}>
            <Input label="Student Name" value={form.student} onChange={set('student')} placeholder="e.g. Aisha Khan" />
            <Input label="Roll Number" value={form.rollNumber} onChange={set('rollNumber')} placeholder="e.g. CS-2023-001" />
          </div>
          <div className="grid grid-2" style={{ gap: 12 }}>
            <Input label="Exam / Subject" value={form.exam} onChange={set('exam')} placeholder="e.g. Database Systems" />
            <Input label="Room" value={form.room} onChange={set('room')} placeholder="e.g. 204" />
          </div>
          <Select label="Exam Day" value={form.examDayId} onChange={set('examDayId')}>
            <option value="">Select exam day (optional)</option>
            {days.map((d) => <option key={d.id} value={String(d.id)}>{d.code} · {d.subject} · {d.date}</option>)}
          </Select>
          <div className="form-group">
            <label className="form-label">Description <span className="req">*</span></label>
            <textarea className="form-control" value={form.description} onChange={set('description')} rows={4} placeholder="Describe what happened..." />
          </div>
          <div className="form-group">
            <label className="form-label">Evidence (demo attachment)</label>
            <input
              className="form-control"
              type="file"
              onChange={(e) => {
                const f = e.target.files?.[0]
                setForm((prev) => ({ ...prev, evidenceName: f ? f.name : '' }))
              }}
            />
            {form.evidenceName ? (
              <div className="flex items-center" style={{ gap: 6, marginTop: 8, fontSize: 13 }}>
                <Paperclip size={14} /> <FileText size={14} /> {form.evidenceName}
                <span className="muted">(stored as a local demo reference — not uploaded to a cloud service)</span>
              </div>
            ) : (
              <span className="form-hint">For this demo, the file reference is kept locally only. No real upload occurs.</span>
            )}
          </div>
          <div className="flex justify-end" style={{ gap: 8 }}>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              <Send size={16} /> {submitting ? 'Submitting...' : 'Submit Incident'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={`Incident #${detail ? detail.id : ''}`}>
        {detail && (
          <div className="flex flex-col" style={{ gap: 12 }}>
            <div className="flex" style={{ gap: 8 }}>
              <Badge variant="neutral">{detail.type}</Badge>
              <Badge variant={detail.severity === 'Critical' ? 'danger' : 'warning'}>{detail.severity}</Badge>
              <Badge variant={statusVariant[detail.status] || 'neutral'}>{detail.status}</Badge>
            </div>
            <div className="muted" style={{ fontSize: 13 }}>Reported by {detail.reportedBy} · {formatDateTime(detail.timestamp)}</div>
            {detail.student !== '—' && <div><b>{detail.student}</b> · {detail.rollNumber}</div>}
            <div>{detail.description}</div>
            <div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Timeline</div>
              <ul className="status-timeline">
                {(detail.timeline || []).map((t, idx) => (
                  <li key={idx} className="timeline-item done"><span className="timeline-dot" /><div className="timeline-label">{t.label}</div><div className="timeline-note">{t.detail}</div></li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
