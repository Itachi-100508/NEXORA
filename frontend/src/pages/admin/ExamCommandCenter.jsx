import { useCallback, useEffect, useState } from 'react'
import {
  Gauge,
  BellRing,
  ShieldAlert,
  CalendarDays,
  LayoutGrid,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { commandCenterService, incidentService } from '../../services'
import PageHeader from '../../components/ui/PageHeader'
import Card from '../../components/ui/Card'
import StatCard from '../../components/ui/StatCard'
import Badge from '../../components/ui/Badge'
import { formatDate } from '../../utils/helpers'

const severityVariant = (severity) =>
  ({ high: 'danger', medium: 'warning', low: 'info' }[severity] || 'neutral')

export default function ExamCommandCenter() {
  const [data, setData] = useState(null)
  const [incidentStats, setIncidentStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await commandCenterService.getOverview()
      setData(res.data)
      setOffline(Boolean(res.offline))
      const incRes = await incidentService.getStats().catch(() => null)
      if (incRes) setIncidentStats(incRes.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const alerts = data?.alerts?.list || []
  const unread = data?.alerts?.unread || 0
  const anomalies = data?.anomalies?.list || []
  const highAnomalies = data?.anomalies?.stats?.bySeverity?.high || 0
  const events = data?.calendar?.events || []
  const nextEvent = data?.calendar?.nextEvent
  const seatingPlans = data?.seating?.plans || []
  const roster = data?.invigilation?.roster || []

  const unresolvedAlerts = alerts.filter((a) => !a.read).length
  const resolvedAnomalies = anomalies.filter((a) => a.status === 'RESOLVED').length

  return (
    <div>
      <PageHeader
        title="Exam Command Center"
        subtitle="Central operations view for exams, alerts, anomalies and invigilation."
        actions={
          offline && (
            <Badge variant="warning" dot>
              Demo/Offline data
            </Badge>
          )
        }
      />

      <div className="grid grid-4">
        <StatCard index={0} label="Active Exams" value={data?.exams?.active ?? '—'} icon={Gauge} variant="primary" />
        <StatCard index={1} label="Unread Alerts" value={unread} icon={BellRing} variant="warning" />
        <StatCard index={2} label="High-priority Anomalies" value={highAnomalies} icon={ShieldAlert} variant="danger" />
        <StatCard index={3} label="Scheduled Events" value={data?.calendar?.upcomingEvents ?? '—'} icon={CalendarDays} variant="accent" />
      </div>

      {incidentStats && (
        <Card padded style={{ marginTop: 16 }}>
          <div className="section-head">
            <div>
              <h3 className="section-title">Exam Day Incident Summary</h3>
              <div className="sub">Incidents across active examination sessions</div>
            </div>
            <Link to="/admin/incidents" className="link-more">
              Manage incidents <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="grid grid-4" style={{ marginTop: 6 }}>
            <HealthItem icon={AlertTriangle} label="Total incidents" value={incidentStats.total} tone="primary" />
            <HealthItem icon={AlertTriangle} label="Open" value={incidentStats.open} tone="warning" />
            <HealthItem icon={ShieldAlert} label="Critical" value={incidentStats.critical} tone="danger" />
            <HealthItem icon={CheckCircle2} label="Resolved" value={incidentStats.resolved} tone="success" />
          </div>
        </Card>
      )}

      {loading && !data ? (
        <div className="grid grid-2" style={{ marginTop: 16 }}>
          <Card><div className="card-body"><div className="skeleton" style={{ height: 120 }} /></div></Card>
          <Card><div className="card-body"><div className="skeleton" style={{ height: 120 }} /></div></Card>
        </div>
      ) : (
        <>
          <div className="grid grid-2" style={{ marginTop: 16 }}>
            <Card padded>
              <div className="section-head">
                <div>
                  <h3 className="section-title">Smart Alerts</h3>
                  <div className="sub">Live operational warnings</div>
                </div>
                <Link to="/admin/exams" className="link-more">
                  View exams <ArrowUpRight size={14} />
                </Link>
              </div>
              <div className="phase1-list">
                {alerts.slice(0, 4).map((a) => (
                  <div key={a.id} className={`phase1-item ${!a.read ? 'unread' : ''}`}>
                    <span className={`phase1-item-ic ${a.type === 'danger' ? 'ic-danger' : a.type === 'warning' ? 'ic-warning' : a.type === 'success' ? 'ic-success' : 'ic-primary'}`}>
                      <BellRing size={16} />
                    </span>
                    <div className="phase1-item-body">
                      <div className="phase1-item-title">{a.title}</div>
                      <div className="phase1-item-sub">{a.scope} · {a.ref}</div>
                    </div>
                    {!a.read && <Badge variant="danger" dot>New</Badge>}
                  </div>
                ))}
                {alerts.length === 0 && <div className="muted">No alerts right now.</div>}
              </div>
            </Card>

            <Card padded>
              <div className="section-head">
                <div>
                  <h3 className="section-title">Academic Anomalies</h3>
                  <div className="sub">Auto-detected irregularities</div>
                </div>
                <Link to="/admin/exams" className="link-more">
                  Review <ArrowUpRight size={14} />
                </Link>
              </div>
              <div className="phase1-list">
                {anomalies.slice(0, 4).map((a) => (
                  <div key={a.id} className="phase1-item">
                    <span className="phase1-item-ic ic-danger">
                      <ShieldAlert size={16} />
                    </span>
                    <div className="phase1-item-body">
                      <div className="phase1-item-title">{a.title}</div>
                      <div className="phase1-item-sub">{a.entity} · {a.className}</div>
                    </div>
                    <Badge variant={severityVariant(a.severity)}>{a.severity}</Badge>
                  </div>
                ))}
                {anomalies.length === 0 && <div className="muted">No anomalies detected.</div>}
              </div>
            </Card>
          </div>

          <div className="grid grid-2" style={{ marginTop: 16 }}>
            <Card padded>
              <div className="section-head">
                <div>
                  <h3 className="section-title">Examination Calendar</h3>
                  <div className="sub">Upcoming exam events</div>
                </div>
              </div>
              {nextEvent ? (
                <div className="next-event">
                  <div className="next-event-date">
                    <div className="next-event-day">{formatDate(nextEvent.date, { day: '2-digit' })}</div>
                    <div className="sub">{formatDate(nextEvent.date, { month: 'short', year: 'numeric' })}</div>
                  </div>
                  <div className="next-event-body">
                    <div className="phase1-item-title">{nextEvent.title}</div>
                    <div className="phase1-item-sub">{nextEvent.slot || 'All day'} · {nextEvent.venue || 'TBD'}</div>
                  </div>
                </div>
              ) : (
                <div className="muted">No upcoming events.</div>
              )}
              <div className="phase1-chip-row">
                <Badge variant="primary">{data?.calendar?.upcomingEvents ?? 0} events scheduled</Badge>
                <Badge variant="info">{events.filter((e) => e.status === 'CONFIRMED').length} confirmed</Badge>
              </div>
            </Card>

            <Card padded>
              <div className="section-head">
                <div>
                  <h3 className="section-title">Operations Health</h3>
                  <div className="sub">Preparedness across modules</div>
                </div>
              </div>
              <div className="health-grid">
                <HealthItem icon={LayoutGrid} label="Seating plans" value={`${seatingPlans.length} ready`} tone="primary" />
                <HealthItem icon={UserCheck} label="Invigilator duties" value={`${roster.length} assigned`} tone="success" />
                <HealthItem icon={CalendarDays} label="Calendar events" value={`${events.length} total`} tone="accent" />
                <HealthItem
                  icon={resolvedAnomalies >= anomalies.length && anomalies.length > 0 ? CheckCircle2 : AlertTriangle}
                  label="Anomalies resolved"
                  value={`${resolvedAnomalies}/${anomalies.length}`}
                  tone={resolvedAnomalies >= anomalies.length ? 'success' : 'warning'}
                />
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

function HealthItem({ icon: Icon, label, value, tone = 'primary' }) {
  const toneClass = {
    primary: 'ic-primary',
    success: 'ic-success',
    warning: 'ic-warning',
    accent: 'ic-accent',
  }[tone]
  return (
    <div className="health-item">
      <span className={`stat-icon ${toneClass}`} style={{ width: 36, height: 36 }}>
        <Icon size={17} />
      </span>
      <div>
        <div className="health-item-label">{label}</div>
        <div className="health-item-value">{value}</div>
      </div>
    </div>
  )
}
