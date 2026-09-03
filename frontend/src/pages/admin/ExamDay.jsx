import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  Clock,
  Users,
  UserCheck,
  DoorOpen,
  AlertTriangle,
  CheckCircle2,
  Hourglass,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { examDayService, alertService, incidentService } from '../../services'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import StatCard from '../../components/ui/StatCard'
import Progress from '../../components/ui/Progress'
import Filter from '../../components/ui/Filter'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonBlock } from '../../components/ui/Skeleton'
import { formatDate } from '../../utils/helpers'

const statusVariant = {
  Scheduled: 'secondary',
  Active: 'primary',
  Completed: 'success',
  'Attention Required': 'warning',
  Incident: 'danger',
}

const ROOM_STATUS_OPTIONS = [
  { value: 'Scheduled', label: 'Scheduled' },
  { value: 'Active', label: 'Active' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Attention Required', label: 'Attention Required' },
  { value: 'Incident', label: 'Incident' },
]

function statusFor(room) {
  if (room.status === 'ISSUE') return 'Incident'
  if (room.attendanceStatus === 'PENDING') return 'Attention Required'
  return 'Active'
}

export default function ExamDay() {
  const { toast } = useToast()
  const [days, setDays] = useState([])
  const [session, setSession] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [incidentStats, setIncidentStats] = useState(null)
  const [latestIncidents, setLatestIncidents] = useState([])
  const [selectedDay, setSelectedDay] = useState('')
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)
  const [roomFilter, setRoomFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [detailRoom, setDetailRoom] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [dayRes, alertRes, incidentRes, incidentListRes] = await Promise.allSettled([
        examDayService.getDays(),
        alertService.getAll(),
        incidentService.getStats(),
        incidentService.getAll(),
      ])
      const daysList = dayRes.status === 'fulfilled' ? dayRes.value.data : []
      setDays(daysList)
      if (daysList.length && !selectedDay) setSelectedDay(String(daysList[0].id))
      if (alertRes.status === 'fulfilled') setAlerts(alertRes.value.data || [])
      if (incidentRes.status === 'fulfilled') setIncidentStats(incidentRes.value.data)
      if (incidentListRes.status === 'fulfilled') {
        const list = incidentListRes.value.data || []
        setLatestIncidents(list.slice(0, 4))
      }
      const anyOffline = [dayRes, alertRes, incidentRes, incidentListRes].some(
        (r) => r.status === 'fulfilled' && r.value.offline,
      )
      setOffline(anyOffline)
    } finally {
      setLoading(false)
    }
  }, [selectedDay])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (selectedDay) {
      let mounted = true
      setSession(null)
      examDayService.getSession(selectedDay).then((res) => {
        if (!mounted) return
        setSession(res.data)
        setOffline((o) => o || Boolean(res.offline))
      })
      return () => {
        mounted = false
      }
    }
  }, [selectedDay])

  const sessionAlerts = useMemo(() => {
    if (!session || !alerts.length) return []
    return alerts.filter((a) => a.title?.toLowerCase().includes(session.rooms?.[0]?.className?.toLowerCase()) || a.title?.toLowerCase().includes('room') || a.title?.toLowerCase().includes('invigilat'))
  }, [session, alerts])

  const filteredRooms = useMemo(() => {
    if (!session) return []
    let rooms = session.rooms || []
    const showRooms = rooms.filter((r) => {
      let ok = true
      if (roomFilter && !r.number.includes(roomFilter)) ok = false
      if (statusFilter && statusFor(r) !== statusFilter) ok = false
      if (classFilter && r.className !== classFilter) ok = false
      return ok
    })
    return showRooms
  }, [session, roomFilter, statusFilter, classFilter])

  const classOptions = useMemo(() => {
    const set = new Set((session?.rooms || []).map((r) => r.className))
    return Array.from(set).map((c) => ({ value: c, label: c }))
  }, [session])

  const handleRoomStatus = async (room, status) => {
    const res = await examDayService.updateRoomStatus(session.id, room.number, status === 'Incident' ? 'ISSUE' : 'ACTIVE')
    if (res.data?.session) {
      setSession(res.data.session)
      toast.success('Room updated', `${room.number} marked as ${status}.`)
    } else {
      toast.info('Updated locally', 'Room status changed in demo data.')
    }
  }

  const handleAttendance = async (room, attendanceStatus) => {
    const res = await examDayService.markRoomAttendance(session.id, room.number, attendanceStatus)
    if (res.data?.session) {
      setSession(res.data.session)
      toast.success('Attendance updated', `${room.number} attendance set to ${attendanceStatus}.`)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} padded><SkeletonBlock rows={3} height={16} /></Card>
        ))}
      </div>
    )
  }

  const s = session || {}
  const stats = s.stats || {}
  const dayMeta = days.find((d) => String(d.id) === String(s.id))
  const attendancePct = stats.registered ? Math.round((stats.present / stats.registered) * 100) : 0

  return (
    <div>
      <PageHeader
        title="Exam Day Control Center"
        subtitle="Live operational monitoring for examination sessions."
        actions={
          <>
            {offline && <Badge variant="warning" dot>Demo/Offline</Badge>}
            {days.length > 0 && (
              <Filter
                label="Exam Day"
                value={selectedDay}
                onChange={(v) => setSelectedDay(v)}
                options={days.map((d) => ({ value: String(d.id), label: `${d.code} · ${formatDate(d.date)}` }))}
              />
            )}
          </>
        }
      />

      {!s.id ? (
        <Card><div className="card-body"><EmptyState icon={CalendarDays} title="No exam day selected" description="Select an exam day from the filter above." /></div></Card>
      ) : (
        <>
          <Card style={{ marginBottom: 16 }}>
            <div className="card-body">
              <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div className="flex items-center" style={{ gap: 10 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 800 }}>{dayMeta?.subject || 'Examination'}</h2>
                    <Badge variant="primary" dot>{dayMeta?.code}</Badge>
                  </div>
                  <div className="muted" style={{ marginTop: 6, display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13 }}>
                    <span className="flex items-center" style={{ gap: 5 }}><CalendarDays size={14} /> {s.date}</span>
                    <span className="flex items-center" style={{ gap: 5 }}><Clock size={14} /> {s.time}</span>
                    <span className="flex items-center" style={{ gap: 5 }}><Users size={14} /> {stats.registered} registered</span>
                  </div>
                </div>
                <div className="flex items-center" style={{ gap: 10 }}>
                  <span className="muted" style={{ fontSize: 13 }}>Attendance</span>
                  <div style={{ width: 180 }}><Progress value={attendancePct} color={attendancePct >= 85 ? 'success' : attendancePct >= 60 ? 'warning' : 'danger'} /></div>
                  <b style={{ fontSize: 16 }}>{attendancePct}%</b>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-4" style={{ marginBottom: 16 }}>
            <StatCard index={0} label="Total Rooms" value={stats.totalRooms} icon={DoorOpen} variant="primary" />
            <StatCard index={1} label="Present" value={stats.present} icon={UserCheck} variant="success" />
            <StatCard index={2} label="Absent" value={stats.absent} icon={Users} variant="warning" />
            <StatCard index={3} label="Rooms w/ Incidents" value={stats.issues} icon={ShieldAlert} variant="danger" />
          </div>

          <div className="grid grid-4" style={{ marginBottom: 20 }}>
            <StatCard index={0} label="Rooms Active" value={stats.activeRooms} icon={TrendingUp} variant="accent" trend={undefined} />
            <StatCard index={1} label="Invigilators Assigned" value={stats.invigilators} icon={UserCheck} variant="secondary" />
            <StatCard index={2} label="Attendance Pending" value={stats.attendancePending} icon={Hourglass} variant="warning" />
            <StatCard index={3} label="Completed" value={stats.totalRooms - stats.activeRooms} icon={CheckCircle2} variant="success" />
          </div>

          {(sessionAlerts.length > 0 || incidentStats) && (
            <div className="grid grid-2-wide" style={{ marginBottom: 20 }}>
              {sessionAlerts.length > 0 && (
                <Card>
                  <div className="card-header"><h3>Smart Alerts</h3></div>
                  <div className="card-body" style={{ padding: '10px 22px' }}>
                    {sessionAlerts.map((a) => (
                      <div key={a.id} className="flex items-center justify-between" style={{ padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{a.title}</div>
                          <div className="muted" style={{ fontSize: 12 }}>{a.text}</div>
                        </div>
                        <Badge variant={a.type === 'danger' ? 'danger' : a.type === 'warning' ? 'warning' : 'primary'}>{a.type}</Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
              {incidentStats && (
                <Card>
                  <div className="card-header">
                    <h3>Exam Day Incident Summary</h3>
                    <Button variant="ghost" size="sm" onClick={() => (window.location.href = '/admin/incidents')}>Manage</Button>
                  </div>
                  <div className="card-body" style={{ padding: '12px 22px' }}>
                    <div className="grid grid-4" style={{ gap: 10, marginBottom: 12 }}>
                      {[
                        { k: 'Total', v: incidentStats.total, c: 'var(--primary)' },
                        { k: 'Open', v: incidentStats.open, c: 'var(--warning)' },
                        { k: 'Resolved', v: incidentStats.resolved, c: 'var(--success)' },
                        { k: 'Critical', v: incidentStats.critical, c: 'var(--danger)' },
                      ].map((x) => (
                        <div key={x.k} className="text-center" style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '10px 4px' }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: x.c }}>{x.v ?? 0}</div>
                          <div className="muted" style={{ fontSize: 12 }}>{x.k}</div>
                        </div>
                      ))}
                    </div>
                    {latestIncidents.length > 0 && (
                      <div className="flex flex-col" style={{ gap: 8 }}>
                        {latestIncidents.map((i) => (
                          <div key={i.id} className="flex items-center justify-between" style={{ fontSize: 13 }}>
                            <span className="flex items-center" style={{ gap: 6, minWidth: 0 }}>
                              <AlertTriangle size={14} color={i.severity === 'Critical' ? 'var(--danger)' : 'var(--warning)'} />
                              <span className="truncate">#{i.id} {i.type} — {i.student}</span>
                            </span>
                            <Badge variant={i.status === 'RESOLVED' ? 'success' : i.status === 'REJECTED' ? 'danger' : i.status === 'UNDER_REVIEW' ? 'warning' : 'primary'}>{i.status}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          )}

          <Card>
            <div className="card-header">
              <h3>Room Monitoring</h3>
              <div className="flex items-center" style={{ gap: 10, flexWrap: 'wrap' }}>
                <div className="input-icon-wrap" style={{ minWidth: 140 }}>
                  <span className="input-icon">○</span>
                  <input className="form-control" placeholder="Room no." value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)} aria-label="Filter by room number" />
                </div>
                <Filter label="Status" value={statusFilter} onChange={setStatusFilter} options={ROOM_STATUS_OPTIONS} />
                <Filter label="Class" value={classFilter} onChange={setClassFilter} options={classOptions} />
              </div>
            </div>
            <div className="card-body">
              {filteredRooms.length === 0 ? (
                <EmptyState icon={DoorOpen} title="No rooms match" description="Adjust your filters to see rooms." />
              ) : (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Room</th>
                        <th>Class / Division</th>
                        <th>Capacity</th>
                        <th>Present / Absent</th>
                        <th>Attendance %</th>
                        <th>Invigilator</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRooms.map((room) => {
                        const st = statusFor(room)
                        const rpct = room.students ? Math.round((room.present / room.students) * 100) : 0
                        return (
                          <tr key={room.id}>
                            <td>
                              <div className="cell-main">{room.number}</div>
                              <div className="muted" style={{ fontSize: 12 }}>Block {room.block}</div>
                            </td>
                            <td>{room.className} {room.division}</td>
                            <td>{room.capacity}</td>
                            <td>{room.present} / {room.absent} absent</td>
                            <td style={{ minWidth: 120 }}>
                              <div className="flex items-center" style={{ gap: 8 }}>
                                <div style={{ width: 80 }}><Progress value={rpct} color={rpct >= 85 ? 'success' : rpct >= 60 ? 'warning' : 'danger'} /></div>
                                <span style={{ fontSize: 13 }}>{rpct}%</span>
                              </div>
                            </td>
                            <td>{room.invigilator}</td>
                            <td><Badge variant={statusVariant[st] || 'neutral'}>{st}</Badge></td>
                            <td>
                              <div className="flex justify-end" style={{ gap: 6 }}>
                                <Button size="sm" variant="outline" onClick={() => setDetailRoom(room)}>Details</Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      <Modal open={Boolean(detailRoom)} onClose={() => setDetailRoom(null)} title={`Room ${detailRoom ? detailRoom.number : ''} — ${detailRoom ? detailRoom.className : ''}`} size="lg">
        {detailRoom && (
          <div className="flex flex-col" style={{ gap: 14 }}>
            <div className="grid grid-4" style={{ gap: 10 }}>
              {[
                { k: 'Exam', v: s.time },
                { k: 'Capacity', v: detailRoom.capacity },
                { k: 'Present', v: detailRoom.present },
                { k: 'Absent', v: detailRoom.absent },
              ].map((x) => (
                <div key={x.k} className="text-center" style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '10px 4px' }}>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>{x.v}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{x.k}</div>
                </div>
              ))}
            </div>

            <div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Invigilator</div>
              <div>{detailRoom.invigilator}</div>
            </div>

            <div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Room Status</div>
              <div className="flex items-center" style={{ gap: 8 }}>
                <Badge variant={statusVariant[statusFor(detailRoom)] || 'neutral'}>{statusFor(detailRoom)}</Badge>
                <div className="flex" style={{ gap: 6 }}>
                  <Button size="sm" variant="outline" onClick={() => handleRoomStatus(detailRoom, 'Incident')}>Mark Incident</Button>
                  <Button size="sm" variant="outline" onClick={() => handleRoomStatus(detailRoom, 'Active')}>Mark Active</Button>
                </div>
              </div>
            </div>

            <div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Attendance</div>
              <div className="flex" style={{ gap: 6 }}>
                <Button size="sm" variant="outline" onClick={() => handleAttendance(detailRoom, 'COMPLETE')}>Mark Complete</Button>
                <Button size="sm" variant="outline" onClick={() => handleAttendance(detailRoom, 'PENDING')}>Mark Pending</Button>
              </div>
            </div>

            <div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Session Timeline</div>
              <ul className="status-timeline">
                <li className="timeline-item done"><span className="timeline-dot" /><div className="timeline-label">Seating verified</div><div className="timeline-time">10:00</div></li>
                <li className="timeline-item done"><span className="timeline-dot" /><div className="timeline-label">Exam started</div><div className="timeline-time">10:30</div></li>
                <li className="timeline-item current"><span className="timeline-dot" /><div className="timeline-label">In progress</div><div className="timeline-time">Now</div></li>
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
