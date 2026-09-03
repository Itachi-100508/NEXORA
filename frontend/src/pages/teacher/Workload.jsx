import { useEffect, useState } from 'react'
import { BookOpen, FlaskConical, ClipboardList, Focus, FileSearch, Users, AlertTriangle, TrendingUp } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { workloadService } from '../../services'
import PageHeader from '../../components/ui/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Progress from '../../components/ui/Progress'
import StatCard from '../../components/ui/StatCard'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { SkeletonBlock } from '../../components/ui/Skeleton'
import { formatDate } from '../../utils/helpers'

const taskVariant = {
  grading: 'primary',
  exam: 'accent',
  revaluation: 'warning',
  meeting: 'secondary',
}

export default function TeacherWorkload() {
  const { user } = useAuth()
  const [wl, setWl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await workloadService.getMine(user?.id || 'teacher-001')
        if (!mounted) return
        setWl(res.data)
        setOffline(Boolean(res.offline))
      } catch {
        if (mounted) setError(true)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [user])

  if (error) return <ErrorState message="Could not load workload." onRetry={() => window.location.reload()} />

  if (loading) {
    return (
      <div className="grid grid-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} padded><SkeletonBlock rows={3} height={16} /></Card>
        ))}
      </div>
    )
  }

  if (!wl) return <Card><div className="card-body"><EmptyState icon={BookOpen} title="No workload data" description="No workload data is available." /></div></Card>

  const s = wl.summary
  const highUtil = s.utilizationPercent > 80

  return (
    <div>
      <PageHeader
        title="My Workload"
        subtitle={`${wl.name} · ${wl.department}`}
        actions={
          <>
            {offline && <Badge variant="warning" dot>Demo/Offline</Badge>}
            {highUtil && <Badge variant="danger" dot>High Load</Badge>}
          </>
        }
      />

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <StatCard index={0} label="Teaching Hours" value={s.teachingHours} icon={BookOpen} variant="primary" />
        <StatCard index={1} label="Lab Hours" value={s.labs} icon={FlaskConical} variant="secondary" />
        <StatCard index={2} label="Assignments To Grade" value={s.assignmentsToGrade} icon={ClipboardList} variant="warning" />
        <StatCard index={3} label="Exams Invigilated" value={s.examsInvigilated} icon={Focus} variant="accent" />
      </div>
      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <StatCard index={0} label="Revaluations" value={s.revaluations} icon={FileSearch} variant="danger" />
        <StatCard index={1} label="Mentoring Students" value={s.mentoring} icon={Users} variant="success" />
        <StatCard index={2} label="Utilization" value={`${s.utilizationPercent}%`} icon={TrendingUp} variant={highUtil ? 'danger' : 'primary'} />
        <StatCard index={3} label="Workload Trend" value={wl.trend?.length ? `${wl.trend[wl.trend.length - 1]}%` : '—'} icon={TrendingUp} variant="secondary" />
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h3>Utilization & Pending Grading</h3>
        </div>
        <div className="card-body">
          <div className="flex items-center" style={{ gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div className="flex justify-between" style={{ marginBottom: 6, fontSize: 13 }}>
                <span className="muted">Overall utilization</span>
                <b>{s.utilizationPercent}%</b>
              </div>
              <Progress value={s.utilizationPercent} color={highUtil ? 'danger' : s.utilizationPercent > 70 ? 'warning' : 'success'} />
            </div>
          </div>
          {highUtil && (
            <div className="flex items-center" style={{ gap: 8, padding: 10, background: 'var(--danger-light)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: 13, marginBottom: 16 }}>
              <AlertTriangle size={16} /> Workload is above the recommended 80% utilisation threshold. Consider redistributing duties.
            </div>
          )}
          {(wl.subjects || []).map((sub) => {
            const pct = sub.total ? Math.round((sub.graded / sub.total) * 100) : 0
            return (
              <div key={sub.name} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div className="flex justify-between" style={{ marginBottom: 6, fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>{sub.name}</span>
                  <span className="muted">{sub.graded} / {sub.total} graded · {sub.students} students</span>
                </div>
                <Progress value={pct} color={pct >= 90 ? 'success' : pct >= 60 ? 'warning' : 'danger'} />
              </div>
            )
          })}
        </div>
      </Card>

      <h2 style={{ fontSize: 17, fontWeight: 800, margin: '20px 0 12px' }}>Upcoming Tasks</h2>
      {(wl.upcoming || []).length === 0 ? (
        <EmptyState icon={ClipboardList} title="No upcoming tasks" />
      ) : (
        <div className="grid grid-2" style={{ marginBottom: 20 }}>
          {(wl.upcoming || []).map((t) => (
            <Card key={`${t.type}-${t.title}`} padded>
              <div className="flex items-center" style={{ gap: 8, marginBottom: 6 }}>
                <Badge variant={taskVariant[t.type] || 'neutral'}>{t.type}</Badge>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{t.title}</span>
              </div>
              <div className="muted" style={{ fontSize: 12.5 }}>{t.deadline ? `Deadline: ${formatDate(t.deadline)}` : `Date: ${t.date}`}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
