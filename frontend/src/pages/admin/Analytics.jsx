import { useEffect, useState } from 'react'
import { Award, BookOpen, TrendingUp, UserCheck } from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'
import { getAnalyticsData } from '../../services/mock'
import PageHeader from '../../components/ui/PageHeader'
import Card from '../../components/ui/Card'
import StatCard from '../../components/ui/StatCard'
import { SkeletonBlock } from '../../components/ui/Skeleton'
import { getCssVar } from '../../utils/helpers'

const C = () => ({
  primary: getCssVar('--primary', '#6366F1'),
  secondary: getCssVar('--secondary', '#6C63FF'),
  accent: getCssVar('--accent', '#20B8D5'),
  success: getCssVar('--success', '#16A34A'),
  warning: getCssVar('--warning', '#F59E0B'),
  danger: getCssVar('--danger', '#DC2626'),
  muted: getCssVar('--muted', '#667085'),
  text: getCssVar('--text', '#172033'),
  grid: getCssVar('--border', '#E6EAF0'),
})

const tooltipStyle = () => ({
  borderRadius: 10,
  border: `1px solid ${C().grid}`,
  background: getCssVar('--card', '#fff'),
  color: getCssVar('--text', '#172033'),
})

const axisTick = (muted) => ({ fill: muted, fontSize: 12 })

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  useEffect(() => {
    getAnalyticsData().then((d) => {
      setData(d)
      setLoading(false)
    })
  }, [])

  const c = C()

  const kpis = [
    { label: 'Overall Pass Rate', value: '85.9%', icon: UserCheck, variant: 'success' },
    { label: 'Average CGPA', value: '8.4', icon: Award, variant: 'primary' },
    { label: 'Approved Results', value: '186', icon: BookOpen, variant: 'accent' },
    { label: 'Trend vs Last Year', value: '+3.3%', icon: TrendingUp, variant: 'warning' },
  ]

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Institution-wide academic performance insights across classes, subjects and departments." />

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        {kpis.map((k, i) => (
          <StatCard key={k.label} label={k.label} value={loading ? '—' : k.value} icon={k.icon} variant={k.variant} index={i} />
        ))}
      </div>

      {loading ? (
        <div className="grid grid-2-equal" style={{ marginBottom: 20 }}>
          <Card padded><SkeletonBlock rows={6} /></Card>
          <Card padded><SkeletonBlock rows={6} /></Card>
        </div>
      ) : (
        <>
          <div className="grid grid-2-equal" style={{ marginBottom: 20 }}>
            <Card padded>
              <h3 className="card-title mb-4">Pass / Fail Breakdown</h3>
              <ResponsiveContainer width="100%" height={270}>
                <PieChart>
                  <Pie data={data.passFail} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3}>
                    {data.passFail.map((e, i) => (
                      <Cell key={i} fill={e.name === 'Pass' ? c.success : c.danger} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle()} />
                  <Legend wrapperStyle={{ fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card padded>
              <h3 className="card-title mb-4">Semester-wise Comparison</h3>
              <ResponsiveContainer width="100%" height={270}>
                <LineChart data={data.semesterComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
                  <XAxis dataKey="sem" tick={axisTick(c.muted)} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={axisTick(c.muted)} axisLine={false} tickLine={false} width={38} />
                  <Tooltip contentStyle={tooltipStyle()} />
                  <Legend wrapperStyle={{ fontSize: 13 }} />
                  <Line type="monotone" dataKey="passRate" name="Pass Rate %" stroke={c.primary} strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="avg" name="Avg Marks" stroke={c.accent} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div className="grid grid-2-equal" style={{ marginBottom: 20 }}>
            <Card padded>
              <h3 className="card-title mb-4">Subject Performance</h3>
              <ResponsiveContainer width="100%" height={290}>
                <BarChart data={data.subjectPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
                  <XAxis dataKey="subject" tick={{ fill: c.muted, fontSize: 11 }} axisLine={false} tickLine={false} interval={0} angle={-18} textAnchor="end" height={54} />
                  <YAxis domain={[0, 100]} tick={axisTick(c.muted)} axisLine={false} tickLine={false} width={32} />
                  <Tooltip contentStyle={tooltipStyle()} />
                  <Legend wrapperStyle={{ fontSize: 13 }} />
                  <Bar dataKey="avg" name="Avg Marks" fill={c.primary} radius={[6, 6, 0, 0]} maxBarSize={38} />
                  <Bar dataKey="passRate" name="Pass %" fill={c.success} radius={[6, 6, 0, 0]} maxBarSize={38} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card padded>
              <h3 className="card-title mb-4">Class Performance</h3>
              <ResponsiveContainer width="100%" height={290}>
                <BarChart data={data.classPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
                  <XAxis dataKey="className" tick={{ fill: c.muted, fontSize: 11 }} axisLine={false} tickLine={false} interval={0} angle={-18} textAnchor="end" height={54} />
                  <YAxis domain={[0, 100]} tick={axisTick(c.muted)} axisLine={false} tickLine={false} width={32} />
                  <Tooltip contentStyle={tooltipStyle()} />
                  <Legend wrapperStyle={{ fontSize: 13 }} />
                  <Bar dataKey="avg" name="Avg %" fill={c.warning} radius={[6, 6, 0, 0]} maxBarSize={38} />
                  <Bar dataKey="passRate" name="Pass %" fill={c.secondary} radius={[6, 6, 0, 0]} maxBarSize={38} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div className="grid grid-2-equal" style={{ marginBottom: 20 }}>
            <Card padded>
              <h3 className="card-title mb-4">Grade Distribution</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.gradeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
                  <XAxis dataKey="grade" tick={axisTick(c.muted)} axisLine={false} tickLine={false} />
                  <YAxis tick={axisTick(c.muted)} axisLine={false} tickLine={false} width={30} />
                  <Tooltip contentStyle={tooltipStyle()} />
                  <Bar dataKey="count" name="Students" fill={c.accent} radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card padded>
              <h3 className="card-title mb-4">Department Comparison</h3>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={data.departmentComparison} outerRadius={100}>
                  <PolarGrid stroke={c.grid} />
                  <PolarAngleAxis dataKey="dept" tick={{ fill: c.muted, fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: c.muted, fontSize: 10 }} />
                  <Radar name="Pass Rate %" dataKey="passRate" stroke={c.primary} fill={c.primary} fillOpacity={0.25} />
                  <Radar name="Avg Marks" dataKey="avg" stroke={c.secondary} fill={c.secondary} fillOpacity={0.18} />
                  <Legend wrapperStyle={{ fontSize: 13 }} />
                  <Tooltip contentStyle={tooltipStyle()} />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card padded>
            <h3 className="card-title mb-4">Performance Trend (3 years)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data.performanceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
                <XAxis dataKey="period" tick={axisTick(c.muted)} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={axisTick(c.muted)} axisLine={false} tickLine={false} width={38} />
                <Tooltip contentStyle={tooltipStyle()} />
                <Line type="monotone" dataKey="percentage" name="Percentage" stroke={c.success} strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}
    </div>
  )
}