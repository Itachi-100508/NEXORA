import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, TrendingUp } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { getMyResults, getStudentPerformance } from '../../services/mock'
import PageHeader from '../../components/ui/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Progress from '../../components/ui/Progress'
import StatusBadge from '../../components/ui/StatusBadge'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonBlock } from '../../components/ui/Skeleton'
import { getCssVar } from '../../utils/helpers'

const axisTick = (muted) => ({ fill: muted, fontSize: 12 })

export default function StudentResults() {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [perf, setPerf] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getMyResults(), getStudentPerformance(21)]).then(([res, p]) => {
      setData(res.data)
      setPerf(p.data)
      setLoading(false)
    })
  }, [])

  const latest = data[0] || null
  const c = { primary: getCssVar('--primary', '#6366F1'), muted: getCssVar('--muted', '#667085'), grid: getCssVar('--border', '#E6EAF0') }
  const tooltipStyle = { borderRadius: 10, border: `1px solid ${c.grid}`, background: getCssVar('--card', '#fff'), color: getCssVar('--text', '#172033') }

  return (
    <div>
      <PageHeader title="My Results" subtitle="Results published for your academic record." />

      {latest && !loading && (
        <div className="grid grid-2-main" style={{ marginBottom: 20 }}>
          <Card padded>
            <div className="flex justify-between items-center" style={{ marginBottom: 14 }}>
              <h3 className="card-title">Semester {latest.semester} Result · {latest.academicYear}</h3>
              <StatusBadge status={latest.status} />
            </div>
            {latest.subjects.map((s, i) => (
              <div key={i} className="flex items-center" style={{ gap: 12, marginBottom: 12 }}>
                <div className="flex items-center justify-between" style={{ flex: 1, width: '100%', minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, flexShrink: 0, minWidth: 150 }}>{s.name}</span>
                  <div style={{ flex: 1, margin: '0 12px' }}>
                    <Progress value={(s.marks / (s.max || 100)) * 100} color={s.pass ? 'success' : 'danger'} />
                  </div>
                  <span className="muted" style={{ fontSize: 12.5, width: 60, textAlign: 'right' }}>{s.marks}/{s.max}</span>
                </div>
              </div>
            ))}
            <Button onClick={() => navigate(`/student/results/${latest.id}`)} style={{ marginTop: 6 }}>
              <FileText size={16} /> View Result
            </Button>
          </Card>

          <Card padded>
            <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
              <TrendingUp size={18} style={{ color: c.primary }} />
              <h3 className="card-title m-0">Performance Trend</h3>
            </div>
            {perf.length > 1 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={perf}>
                  <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
                  <XAxis dataKey="semester" tick={axisTick(c.muted)} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={axisTick(c.muted)} axisLine={false} tickLine={false} width={32} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 13 }} />
                  <Line type="monotone" dataKey="percentage" name="%" stroke={c.primary} strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="state-block">
                <Badge variant="neutral">Not enough semesters yet</Badge>
              </div>
            )}
          </Card>
        </div>
      )}

      <div className="grid grid-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} padded><SkeletonBlock rows={4} height={16} /></Card>
          ))
        ) : data.length ? (
          data.map((r) => (
            <Card key={r.id} padded style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="flex justify-between items-center">
                <Badge variant="primary">Semester {r.semester}</Badge>
                <StatusBadge status={r.status} />
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>Academic Year</div>
                <div style={{ fontWeight: 600 }}>{r.academicYear}</div>
              </div>
              <div className="grid grid-2">
                <div>
                  <div className="muted" style={{ fontSize: 12 }}>Percentage</div>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>{r.percentage}%</div>
                </div>
                <div>
                  <div className="muted" style={{ fontSize: 12 }}>CGPA</div>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>{r.cgpa}</div>
                </div>
              </div>
              <Button variant="outline" onClick={() => navigate(`/student/results/${r.id}`)} style={{ marginTop: 'auto' }}>
                <FileText size={16} /> View Result
              </Button>
            </Card>
          ))
        ) : (
          <Card padded>
            <EmptyState icon={FileText} title="No results published" description="Your published results will appear here once the examination office releases them." />
          </Card>
        )}
      </div>
    </div>
  )
}