import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, ArrowRight } from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts'
import { useAuth } from '../../context/AuthContext'
import { studentInsightService } from '../../services'
import PageHeader from '../../components/ui/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { SkeletonBlock } from '../../components/ui/Skeleton'

const toneVariant = {
  positive: 'success',
  warning: 'warning',
  info: 'primary',
}

export default function Journey() {
  const { user } = useAuth()
  const [journey, setJourney] = useState(null)
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await studentInsightService.getJourney(user?.id || 21, user?.name || 'Aisha Khan')
        if (!mounted) return
        setJourney(res.data)
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

  if (error) {
    return <ErrorState message="Could not load academic journey." onRetry={() => window.location.reload()} />
  }

  if (loading) {
    return (
      <div className="grid grid-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} padded><SkeletonBlock rows={3} height={16} /></Card>
        ))}
      </div>
    )
  }

  if (!journey) {
    return <Card><div className="card-body"><EmptyState icon={GraduationCap} title="No academic journey data" description="No journey data is available yet." /></div></Card>
  }

  const semesters = journey.semesters || []
  const insights = journey.insights || []
  const last = semesters[semesters.length - 1]
  const prev = semesters[semesters.length - 2]

  const trendData = semesters.map((s) => ({
    semester: `Sem ${s.semester}`,
    SGPA: s.sgpa,
    CGPA: s.cgpa,
    'Class SGPA': s.classSgpa,
  }))
  const attendanceData = semesters.map((s) => ({
    semester: `Sem ${s.semester}`,
    Attendance: s.attendance,
    SGPA: s.sgpa,
  }))

  return (
    <div>
      <PageHeader
        title="Academic Journey & Insights"
        subtitle={`${journey.rollNumber} · ${user?.className || ''}`}
        actions={offline && <Badge variant="warning" dot>Demo/Offline</Badge>}
      />

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        {[
          { k: 'Current CGPA', v: journey.currentCgpa, c: 'var(--primary)' },
          { k: 'Latest SGPA', v: journey.currentSgpa, c: 'var(--secondary)' },
          { k: 'Current Rank', v: `#${journey.currentRank}`, c: 'var(--warning)' },
          { k: 'Cohort Size', v: journey.totalStudents, c: 'var(--success)' },
        ].map((x) => (
          <Card key={x.k} padded className="text-center">
            <div className="muted" style={{ fontSize: 12 }}>{x.k}</div>
            <div style={{ fontSize: 24, fontWeight: 800, margin: '6px 0', color: x.c }}>{x.v}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-2-wide" style={{ marginBottom: 20 }}>
        <Card>
          <div className="card-header"><h3>CGPA / SGPA Trend</h3></div>
          <div className="card-body">
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="semester" stroke="var(--muted)" fontSize={12} />
                  <YAxis domain={[0, 10]} stroke="var(--muted)" fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="SGPA" stroke="var(--primary)" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="CGPA" stroke="var(--success)" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Class SGPA" stroke="var(--muted)" strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        <Card>
          <div className="card-header"><h3>Attendance ↔ Result Correlation</h3></div>
          <div className="card-body">
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="semester" stroke="var(--muted)" fontSize={12} />
                  <YAxis stroke="var(--muted)" fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Attendance" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="SGPA" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="muted" style={{ fontSize: 12.5, marginTop: 10, padding: 10, background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)' }}>
              Higher attendance consistently aligns with higher SGPA across semesters. This is a deterministic demo correlation — labelled intelligence, not a formal statistical model.
            </div>
          </div>
        </Card>
      </div>

      <h2 style={{ fontSize: 17, fontWeight: 800, margin: '20px 0 12px' }}>Semester Cards</h2>
      <div className="grid grid-3" style={{ marginBottom: 20 }}>
        {semesters.map((s, idx) => (
          <Card key={s.semester} padded>
            <div className="flex items-center" style={{ gap: 10, marginBottom: 10 }}>
              <span className="stat-icon ic-primary" style={{ width: 40, height: 40 }}><GraduationCap size={20} /></span>
              <div>
                <div style={{ fontWeight: 700 }}>Semester {s.semester}</div>
                <div className="muted" style={{ fontSize: 12 }}>{s.academicYear}</div>
              </div>
            </div>
            <div className="grid grid-3" style={{ gap: 8, marginBottom: 10 }}>
              <div className="text-center" style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '8px 2px' }}>
                <div style={{ fontWeight: 800 }}>{s.sgpa}</div><div className="muted" style={{ fontSize: 11 }}>SGPA</div>
              </div>
              <div className="text-center" style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '8px 2px' }}>
                <div style={{ fontWeight: 800 }}>{s.cgpa}</div><div className="muted" style={{ fontSize: 11 }}>CGPA</div>
              </div>
              <div className="text-center" style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '8px 2px' }}>
                <div style={{ fontWeight: 800 }}>{s.attendance}%</div><div className="muted" style={{ fontSize: 11 }}>Att.</div>
              </div>
            </div>
            <div className="flex" style={{ gap: 16, fontSize: 12.5, flexWrap: 'wrap' }}>
              <span className="muted">Rank #{s.rank} / {s.totalStudents}</span>
              <span className="muted">{s.credits} credits</span>
            </div>
            {s.subjects && (
              <div style={{ marginTop: 10, fontSize: 12 }}>
                {s.subjects.slice(0, 2).map((sub) => (
                  <div key={sub.name} className="flex justify-between" style={{ padding: '3px 0' }}>
                    <span className="muted">{sub.name}</span>
                    <b>{sub.marks}</b>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      <h2 style={{ fontSize: 17, fontWeight: 800, margin: '20px 0 12px' }}>Performance Insights</h2>
      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        {insights.map((i) => (
          <Card key={i.id} padded>
            <div className="flex items-center" style={{ gap: 8, marginBottom: 6 }}>
              <Badge variant={toneVariant[i.tone] || 'neutral'}>{i.type}</Badge>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{i.title}</div>
            </div>
            <div className="muted" style={{ fontSize: 13 }}>{i.text}</div>
          </Card>
        ))}
      </div>

      {last && prev && (
        <>
          <h2 style={{ fontSize: 17, fontWeight: 800, margin: '20px 0 12px' }}>Semester Comparison</h2>
          <Card style={{ marginBottom: 20 }}>
            <div className="card-body">
              <div className="flex items-center" style={{ gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                <div>
                  <Badge variant="secondary">Sem {prev.semester}</Badge>
                  <div className="muted" style={{ fontSize: 12 }}>SGPA {prev.sgpa} · Att {prev.attendance}% · Rank #{prev.rank}</div>
                </div>
                <ArrowRight size={18} className="muted" />
                <div>
                  <Badge variant="primary">Sem {last.semester}</Badge>
                  <div className="muted" style={{ fontSize: 12 }}>SGPA {last.sgpa} · Att {last.attendance}% · Rank #{last.rank}</div>
                </div>
              </div>
              <div className="grid grid-3" style={{ gap: 10 }}>
                {[
                  { k: 'SGPA change', v: last.sgpa - prev.sgpa, unit: '' },
                  { k: 'Attendance change', v: last.attendance - prev.attendance, unit: '%' },
                  { k: 'Rank change', v: prev.rank - last.rank, unit: ' places' },
                ].map((x) => (
                  <div key={x.k} className="text-center" style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '12px 4px' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: x.v >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {x.v >= 0 ? '+' : ''}{x.v}{x.unit}
                    </div>
                    <div className="muted" style={{ fontSize: 12 }}>{x.k}</div>
                  </div>
                ))}
              </div>
              {last.subjects && prev.subjects && (
                <div style={{ marginTop: 14 }}>
                  <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Subject-level change (top subjects)</div>
                  <div className="table-responsive">
                    <table className="table">
                      <thead><tr><th>Subject</th><th>Sem {prev.semester}</th><th>Sem {last.semester}</th><th>Change</th></tr></thead>
                      <tbody>
                        {last.subjects.slice(0, 4).map((sub) => {
                          const oldS = prev.subjects.find((p) => p.name === sub.name)
                          const diff = oldS ? sub.marks - oldS.marks : null
                          return (
                            <tr key={sub.name}>
                              <td>{sub.name}</td>
                              <td>{oldS ? oldS.marks : '—'}</td>
                              <td>{sub.marks}</td>
                              <td style={{ color: diff > 0 ? 'var(--success)' : diff < 0 ? 'var(--danger)' : 'var(--muted)' }}>
                                {diff === null ? '—' : `${diff > 0 ? '+' : ''}${diff}`}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      <div className="flex" style={{ gap: 10, flexWrap: 'wrap' }}>
        <Link to="/student/results" style={{ textDecoration: 'none' }}><Badge variant="primary" dot>Compare with your results</Badge></Link>
        <Link to="/student/attendance" style={{ textDecoration: 'none' }}><Badge variant="secondary" dot>Attendance history</Badge></Link>
      </div>
    </div>
  )
}
