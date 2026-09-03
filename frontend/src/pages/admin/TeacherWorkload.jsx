import { useEffect, useState } from 'react'
import { Users, TrendingUp, ClipboardList, AlertTriangle, BookOpen } from 'lucide-react'
import { workloadService } from '../../services'
import PageHeader from '../../components/ui/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Progress from '../../components/ui/Progress'
import StatCard from '../../components/ui/StatCard'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { SkeletonBlock } from '../../components/ui/Skeleton'

export default function AdminTeacherWorkload() {
  const [teachers, setTeachers] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [allRes, sumRes] = await Promise.allSettled([workloadService.getAll(), workloadService.getSummary()])
        if (!mounted) return
        if (allRes.status === 'fulfilled') {
          setTeachers(allRes.value.data || [])
          setOffline(Boolean(allRes.value.offline))
        }
        if (sumRes.status === 'fulfilled') setSummary(sumRes.value.data)
      } catch {
        if (mounted) setError(true)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  if (error) return <ErrorState message="Could not load teacher workload." onRetry={() => window.location.reload()} />

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
        title="Teacher Workload Intelligence"
        subtitle="Aggregate teaching workload and utilisation across faculty."
        actions={offline && <Badge variant="warning" dot>Demo/Offline</Badge>}
      />

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <StatCard index={0} label="Faculty" value={summary?.teachers ?? teachers.length} icon={Users} variant="primary" />
        <StatCard index={1} label="Avg Utilization" value={`${summary?.avgUtilization ?? 0}%`} icon={TrendingUp} variant="accent" />
        <StatCard index={2} label="Assignments To Grade" value={summary?.totalAssignmentsToGrade ?? 0} icon={ClipboardList} variant="warning" />
        <StatCard index={3} label="Avg Teaching Hours" value={summary?.avgTeachingHours ?? 0} icon={BookOpen} variant="secondary" />
      </div>

      {(summary?.overloaded || []).length > 0 && (
        <Card style={{ marginBottom: 20 }}>
          <div className="card-header"><h3>Overloaded (Utilization &gt; 80%)</h3></div>
          <div className="card-body" style={{ padding: '10px 22px' }}>
            {summary.overloaded.map((o) => (
              <div key={o.name} className="flex items-center" style={{ gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                <AlertTriangle size={16} color="var(--danger)" />
                <span style={{ fontWeight: 600, flex: 1 }}>{o.name}</span>
                <Badge variant="danger">{o.utilizationPercent}%</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <div className="card-header"><h3>Faculty Workload</h3></div>
        <div className="card-body">
          {teachers.length === 0 ? (
            <EmptyState icon={Users} title="No teacher workload data" />
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Teacher</th>
                    <th>Department</th>
                    <th>Teaching Hrs</th>
                    <th>Labs</th>
                    <th>To Grade</th>
                    <th>Invigilations</th>
                    <th>Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((t) => {
                    const pct = t.summary?.utilizationPercent || 0
                    return (
                      <tr key={t.id}>
                        <td style={{ fontWeight: 600 }}>{t.name}</td>
                        <td>{t.department}</td>
                        <td>{t.summary?.teachingHours}</td>
                        <td>{t.summary?.labs}</td>
                        <td>{t.summary?.assignmentsToGrade}</td>
                        <td>{t.summary?.examsInvigilated}</td>
                        <td style={{ minWidth: 140 }}>
                          <div className="flex items-center" style={{ gap: 8 }}>
                            <div style={{ width: 80 }}><Progress value={pct} color={pct > 80 ? 'danger' : pct > 70 ? 'warning' : 'success'} /></div>
                            <span style={{ fontSize: 13 }}>{pct}%</span>
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
    </div>
  )
}
