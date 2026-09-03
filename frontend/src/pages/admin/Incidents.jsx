import { useCallback, useEffect, useMemo, useState } from 'react'
import { ShieldAlert, Search, CheckCircle2, XCircle, UserCheck, MessageSquare } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { incidentService } from '../../services'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import StatCard from '../../components/ui/StatCard'
import Filter from '../../components/ui/Filter'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonBlock } from '../../components/ui/Skeleton'
import { formatDateTime } from '../../utils/helpers'

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Open' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'REJECTED', label: 'Rejected' },
]
const SEVERITY_OPTIONS = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Critical', label: 'Critical' },
]
const TYPE_OPTIONS = ['Malpractice', 'Late Arrival', 'Technical Issue', 'Medical Issue', 'Attendance Issue', 'Other'].map((t) => ({ value: t, label: t }))
const statusVariant = {
  OPEN: 'primary',
  UNDER_REVIEW: 'warning',
  RESOLVED: 'success',
  REJECTED: 'danger',
}
const REVIEWERS = ['Sarah Mitchell', 'Vikram Joshi', 'Meera Iyer']

export default function AdminIncidents() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [items, setItems] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)
  const [filters, setFilters] = useState({ status: '', severity: '', type: '', search: '', reporter: '' })
  const [detail, setDetail] = useState(null)
  const [remark, setRemark] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [listRes, statsRes] = await Promise.allSettled([incidentService.getAll(filters), incidentService.getStats()])
      if (listRes.status === 'fulfilled') {
        setItems(listRes.value.data || [])
        setOffline(Boolean(listRes.value.offline))
      }
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data)
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(filters)])

  useEffect(() => {
    load()
  }, [load])

  const setFilter = (k) => (v) => setFilters((f) => ({ ...f, [k]: v }))

  const reporters = useMemo(() => Array.from(new Set(items.map((i) => i.reportedBy))).map((r) => ({ value: r, label: r })), [items])

  const handleDecide = async (decision) => {
    if (!detail) return
    const res = await incidentService.decide(detail.id, decision, remark || undefined, user?.name)
    toast.success(decision === 'resolve' ? 'Incident resolved' : 'Incident rejected', `#${detail.id} updated.`)
    setDetail(null)
    setRemark('')
    load()
    setStats(null)
    const st = await incidentService.getStats()
    setStats(st.data)
  }

  const handleAssign = async () => {
    if (!detail) return
    await incidentService.update(detail.id, { reviewer: detail.reviewer || 'Vikram Joshi' }, user?.name)
    toast.success('Reviewer assigned', `#${detail.id} is now under review.`)
    setDetail(null)
    load()
    const st = await incidentService.getStats()
    setStats(st.data)
  }

  const handleRemark = async () => {
    if (!remark.trim() || !detail) return
    await incidentService.update(detail.id, { remarkText: remark }, user?.name)
    toast.success('Remark added', `#${detail.id} updated.`)
    setRemark('')
    const updated = await incidentService.getById(detail.id)
    setDetail(updated.data || null)
    load()
  }

  if (loading) {
    return (
      <div className="grid grid-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} padded><SkeletonBlock rows={3} height={16} /></Card>
        ))}
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Incident Management"
        subtitle="Review and resolve examination incidents with a full audit trail."
        actions={offline && <Badge variant="warning" dot>Demo/Offline</Badge>}
      />

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <StatCard index={0} label="Total Incidents" value={stats?.total} icon={ShieldAlert} variant="primary" />
        <StatCard index={1} label="Open" value={stats?.open} icon={ShieldAlert} variant="warning" />
        <StatCard index={2} label="Under Review" value={stats?.underReview} icon={UserCheck} variant="accent" />
        <StatCard index={3} label="Resolved" value={stats?.resolved} icon={CheckCircle2} variant="success" />
      </div>
      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <StatCard index={0} label="Rejected" value={stats?.rejected} icon={XCircle} variant="danger" />
        <StatCard index={1} label="Critical" value={stats?.critical} icon={ShieldAlert} variant="danger" />
        <StatCard index={2} label="High / Medium / Low" value={`${stats?.bySeverity?.high ?? 0} / ${stats?.bySeverity?.medium ?? 0} / ${stats?.bySeverity?.low ?? 0}`} icon={ShieldAlert} variant="secondary" />
        <StatCard index={3} label="Resolution Rate" value={stats?.total ? `${Math.round((stats.resolved / stats.total) * 100)}%` : '—'} icon={CheckCircle2} variant="success" />
      </div>

      <Card>
        <div className="card-header">
          <div className="flex items-center" style={{ gap: 10, flexWrap: 'wrap' }}>
            <div className="input-icon-wrap" style={{ minWidth: 220 }}>
              <span className="input-icon"><Search size={17} /></span>
              <input className="form-control" placeholder="Search student, exam, roll..." value={filters.search} onChange={(e) => setFilter('search')(e.target.value)} />
            </div>
            <Filter label="Status" value={filters.status} onChange={setFilter('status')} options={STATUS_OPTIONS} />
            <Filter label="Severity" value={filters.severity} onChange={setFilter('severity')} options={SEVERITY_OPTIONS} />
            <Filter label="Type" value={filters.type} onChange={setFilter('type')} options={TYPE_OPTIONS} />
            <Filter label="Reporter" value={filters.reporter} onChange={setFilter('reporter')} options={reporters} />
          </div>
        </div>
        <div className="card-body">
          {items.length === 0 ? (
            <EmptyState icon={ShieldAlert} title="No incidents match" description="Adjust filters to see incidents." />
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
                    <th>Reported By</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.id}>
                      <td>#{i.id}</td>
                      <td>{i.type}</td>
                      <td><Badge variant={i.severity === 'Critical' ? 'danger' : i.severity === 'High' ? 'warning' : 'neutral'}>{i.severity}</Badge></td>
                      <td>{i.student}</td>
                      <td>{i.exam}</td>
                      <td>{i.room}</td>
                      <td>{i.reportedBy}</td>
                      <td className="muted" style={{ fontSize: 13 }}>{formatDateTime(i.timestamp)}</td>
                      <td><Badge variant={statusVariant[i.status] || 'neutral'}>{i.status}</Badge></td>
                      <td style={{ textAlign: 'right' }}>
                        <Button size="sm" variant="outline" onClick={() => { setDetail(i); setRemark('') }}>Manage</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={`Incident #${detail ? detail.id : ''}`} size="lg">
        {detail && (
          <div className="flex flex-col" style={{ gap: 14 }}>
            <div className="flex" style={{ gap: 8, flexWrap: 'wrap' }}>
              <Badge variant="neutral">{detail.type}</Badge>
              <Badge variant={detail.severity === 'Critical' ? 'danger' : 'warning'}>{detail.severity}</Badge>
              <Badge variant={statusVariant[detail.status] || 'neutral'}>{detail.status}</Badge>
              {detail.reviewer && <Badge variant="primary" dot>Reviewer: {detail.reviewer}</Badge>}
            </div>

            <div className="grid grid-2" style={{ gap: 10 }}>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>Student</div>
                <div><b>{detail.student}</b> · {detail.rollNumber}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>Exam / Room</div>
                <div>{detail.exam} · Room {detail.room}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>Reported By</div>
                <div>{detail.reportedBy}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>Date / Time</div>
                <div>{formatDateTime(detail.timestamp)}</div>
              </div>
            </div>

            <div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Description</div>
              <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: 10 }}>{detail.description}</div>
            </div>

            <div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Timeline / Audit Trail</div>
              <ul className="status-timeline">
                {(detail.timeline || []).map((t, idx) => (
                  <li key={idx} className="timeline-item done"><span className="timeline-dot" /><div className="timeline-label">{t.label} · {t.by}</div><div className="timeline-note">{t.detail}</div><div className="timeline-time">{formatDateTime(t.at)}</div></li>
                ))}
              </ul>
            </div>

            <div className="flex" style={{ gap: 8, flexWrap: 'wrap' }}>
              {!detail.reviewer && (
                <Button variant="outline" onClick={handleAssign}><UserCheck size={16} /> Assign Reviewer</Button>
              )}
              {detail.status === 'OPEN' || detail.status === 'UNDER_REVIEW' ? (
                <>
                  <Button variant="soft-primary" onClick={() => handleDecide('resolve')}><CheckCircle2 size={16} /> Resolve</Button>
                  <Button variant="danger-soft" onClick={() => handleDecide('reject')}><XCircle size={16} /> Reject</Button>
                </>
              ) : null}
            </div>

            <div className="flex" style={{ gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <Input label="Add remark" value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Record a note / outcome..." />
              </div>
              <Button variant="outline" onClick={handleRemark} aria-label="Add remark"><MessageSquare size={16} /></Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
