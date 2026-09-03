import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, ClipboardList, Users, XCircle } from 'lucide-react'
import { getAdminAttendanceOverview } from '../../services/mock'
import PageHeader from '../../components/ui/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import StatCard from '../../components/ui/StatCard'
import { SkeletonBlock } from '../../components/ui/Skeleton'
import { formatDate } from '../../utils/helpers'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function AdminAttendance() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminAttendanceOverview().then((res) => {
      setData(res)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div>
        <PageHeader title="Attendance Monitoring" subtitle="Institution-wide attendance overview." />
        <div className="grid grid-4" style={{ marginBottom: 20 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} padded><SkeletonBlock rows={3} height={16} /></Card>
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  const chartData = data.classSummary.slice(0, 10)

  return (
    <div>
      <PageHeader
        title="Attendance Monitoring"
        subtitle="Institution-wide attendance overview."
      />

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <StatCard label="Students Today" value={data.todayStats.totalStudents} icon={Users} variant="primary" index={0} />
        <StatCard label="Present Today" value={data.todayStats.present} icon={CheckCircle2} variant="success" index={1} />
        <StatCard label="Absent Today" value={data.todayStats.absent} icon={XCircle} variant="danger" index={2} />
        <StatCard label="Total Records" value={data.totalRecords} icon={ClipboardList} variant="accent" index={3} />
      </div>

      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <Card padded>
          <h3 className="card-title mb-4">Today's Attendance Summary</h3>
          <div className="flex items-center" style={{ gap: 12, marginBottom: 16 }}>
            <div className="stat-icon ic-success"><CheckCircle2 size={22} /></div>
            <div>
              <div className="stat-value">{data.todayStats.percentage}%</div>
              <div className="stat-label">Attendance Rate</div>
            </div>
          </div>
          <div className="muted" style={{ fontSize: 13.5 }}>
            {data.todayStats.present} of {data.todayStats.totalStudents} students present today across all classes.
          </div>
        </Card>

        <Card padded>
          <h3 className="card-title mb-4">Class-wise Attendance</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="className" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)' }}
                formatter={(v) => [`${v}%`, 'Attendance']}
              />
              <Bar dataKey="percentage" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <div className="card-header">
          <h3>Class-wise Attendance Breakdown</h3>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Class</th>
                <th style={{ textAlign: 'center' }}>Records</th>
                <th style={{ textAlign: 'center' }}>Present</th>
                <th style={{ textAlign: 'center' }}>Absent</th>
                <th style={{ textAlign: 'center' }}>Total</th>
                <th style={{ textAlign: 'center' }}>Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {data.classSummary.map((c) => (
                <motion.tr
                  key={c.className}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.02 }}
                >
                  <td className="cell-main">{c.className}</td>
                  <td style={{ textAlign: 'center' }}>{c.records}</td>
                  <td style={{ textAlign: 'center' }}><Badge variant="success">{c.present}</Badge></td>
                  <td style={{ textAlign: 'center' }}><Badge variant="danger">{c.absent}</Badge></td>
                  <td style={{ textAlign: 'center' }}>{c.total}</td>
                  <td style={{ textAlign: 'center' }}>
                    <Badge variant={c.percentage >= 80 ? 'success' : c.percentage >= 60 ? 'warning' : 'danger'}>
                      {c.percentage}%
                    </Badge>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card style={{ marginTop: 20 }}>
        <div className="card-header">
          <h3>Recent Attendance Records</h3>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Class</th>
                <th>Division</th>
                <th style={{ textAlign: 'center' }}>Present</th>
                <th style={{ textAlign: 'center' }}>Absent</th>
                <th style={{ textAlign: 'center' }}>Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {data.recentRecords.map((r) => (
                <tr key={r.id}>
                  <td className="cell-main">
                    {formatDate(r.date, { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td>{r.className}</td>
                  <td><Badge variant="accent">{r.division}</Badge></td>
                  <td style={{ textAlign: 'center' }}><Badge variant="success">{r.presentCount}</Badge></td>
                  <td style={{ textAlign: 'center' }}><Badge variant="danger">{r.absentCount}</Badge></td>
                  <td style={{ textAlign: 'center' }}>
                    <Badge variant={r.attendancePercentage >= 80 ? 'success' : r.attendancePercentage >= 60 ? 'warning' : 'danger'}>
                      {r.attendancePercentage}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
