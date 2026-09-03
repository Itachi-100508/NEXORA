import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, CheckCircle2, FileSpreadsheet, XCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getStudentOwnAttendance } from '../../services/mock'
import PageHeader from '../../components/ui/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import StatCard from '../../components/ui/StatCard'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonBlock } from '../../components/ui/Skeleton'
import { formatDate } from '../../utils/helpers'

export default function StudentAttendance() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const studentId = user?.id || 21
    getStudentOwnAttendance(studentId).then((res) => {
      setData(res)
      setLoading(false)
    })
  }, [user])

  const currentMonthRecords = useMemo(() => {
    if (!data) return []
    const now = new Date()
    const month = now.getMonth()
    const year = now.getFullYear()
    return data.records.filter((r) => {
      const d = new Date(r.date)
      return d.getMonth() === month && d.getFullYear() === year
    })
  }, [data])

  const currentMonthPresent = currentMonthRecords.filter((r) => r.status === 'PRESENT').length
  const currentMonthAbsent = currentMonthRecords.filter((r) => r.status === 'ABSENT').length
  const currentMonthPct = currentMonthRecords.length > 0 ? Math.round((currentMonthPresent / currentMonthRecords.length) * 100) : 0

  return (
    <div>
      <PageHeader
        title="My Attendance"
        subtitle={user?.name ? `Viewing attendance records for ${user.name}` : 'View your attendance records'}
      />

      {loading ? (
        <div className="grid grid-4" style={{ marginBottom: 20 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} padded><SkeletonBlock rows={3} height={16} /></Card>
          ))}
        </div>
      ) : !data ? (
        <Card padded>
          <EmptyState title="No attendance data" description="No attendance records found for your account." />
        </Card>
      ) : (
        <>
          <div className="grid grid-4" style={{ marginBottom: 20 }}>
            <StatCard
              label="Overall Attendance"
              value={`${data.summary.percentage}%`}
              icon={FileSpreadsheet}
              variant={data.summary.percentage >= 75 ? 'success' : data.summary.percentage >= 60 ? 'warning' : 'danger'}
              index={0}
            />
            <StatCard label="Total Present" value={data.summary.present} icon={CheckCircle2} variant="success" index={1} />
            <StatCard label="Total Absent" value={data.summary.absent} icon={XCircle} variant="danger" index={2} />
            <StatCard
              label="This Month"
              value={`${currentMonthPct}%`}
              icon={CalendarDays}
              variant="primary"
              index={3}
            />
          </div>

          <div className="grid grid-2" style={{ marginBottom: 20 }}>
            <Card padded>
              <h3 className="card-title mb-4">Overall Summary</h3>
              <div className="flex items-center" style={{ gap: 16, marginBottom: 16 }}>
                <div className="score-ring" style={{ '--pct': data.summary.percentage }}>
                  <div className="score-ring-inner">
                    <div className="val">{data.summary.percentage}%</div>
                    <div className="lbl">Attendance</div>
                  </div>
                </div>
                <div className="flex flex-col" style={{ gap: 8 }}>
                  <div className="flex items-center" style={{ gap: 8 }}>
                    <Badge variant="success" dot>Present: {data.summary.present}</Badge>
                  </div>
                  <div className="flex items-center" style={{ gap: 8 }}>
                    <Badge variant="danger" dot>Absent: {data.summary.absent}</Badge>
                  </div>
                  <div className="flex items-center" style={{ gap: 8 }}>
                    <Badge variant="muted">Total Days: {data.summary.total}</Badge>
                  </div>
                </div>
              </div>
            </Card>

            <Card padded>
              <h3 className="card-title mb-4">This Month</h3>
              <div className="flex items-center" style={{ gap: 16 }}>
                <div className="score-ring" style={{ '--pct': currentMonthPct }}>
                  <div className="score-ring-inner">
                    <div className="val">{currentMonthPct}%</div>
                    <div className="lbl">This Month</div>
                  </div>
                </div>
                <div className="flex flex-col" style={{ gap: 8 }}>
                  <div className="flex items-center" style={{ gap: 8 }}>
                    <Badge variant="success" dot>Present: {currentMonthPresent}</Badge>
                  </div>
                  <div className="flex items-center" style={{ gap: 8 }}>
                    <Badge variant="danger" dot>Absent: {currentMonthAbsent}</Badge>
                  </div>
                  <div className="flex items-center" style={{ gap: 8 }}>
                    <Badge variant="muted">Days: {currentMonthRecords.length}</Badge>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <div className="card-header">
              <h3>Attendance History</h3>
              <Badge variant="muted">{data.records.length} records</Badge>
            </div>
            {data.records.length === 0 ? (
              <EmptyState title="No attendance records" description="No attendance has been recorded yet." />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Class</th>
                      <th>Division</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.records.map((r, i) => (
                      <motion.tr
                        key={`${r.date}-${r.division}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                      >
                        <td className="cell-main">
                          {formatDate(r.date, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td>{r.className}</td>
                        <td><Badge variant="accent">{r.division}</Badge></td>
                        <td>
                          {r.status === 'PRESENT' ? (
                            <Badge variant="success" dot>Present</Badge>
                          ) : (
                            <Badge variant="danger" dot>Absent</Badge>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
