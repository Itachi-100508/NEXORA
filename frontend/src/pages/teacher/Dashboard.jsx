import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { School, BookOpen, Timer, Send, CheckCircle2, XCircle, PenLine, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getStats } from '../../services/mock'
import { getGreeting } from '../../utils/helpers'
import StatCard from '../../components/ui/StatCard'
import Card from '../../components/ui/Card'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import StatusBadge from '../../components/ui/StatusBadge'
import { SkeletonBlock } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'

export default function TeacherDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    getStats('teacher').then((res) => {
      if (!mounted) return
      setStats(res.stats)
      setRecent(res.recentSubmissions)
      setLoading(false)
    })
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div>
      <PageHeader
        title={`${getGreeting()}, ${user?.name?.split(' ')[0] || 'Teacher'} 👋`}
        subtitle="Here's an overview of your teaching assignments."
        actions={
          <Button onClick={() => navigate('/teacher/assignments')}>
            <PenLine size={16} /> Enter Marks
          </Button>
        }
      />

      {loading ? (
        <div className="grid grid-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} padded><SkeletonBlock rows={3} height={16} /></Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-3" style={{ marginBottom: 20 }}>
            <StatCard label="Assigned Classes" value={stats?.assignedClasses} icon={School} variant="primary" index={0} />
            <StatCard label="Assigned Subjects" value={stats?.assignedSubjects} icon={BookOpen} variant="secondary" index={1} />
            <StatCard label="Pending Marks" value={stats?.pendingMarks} icon={Timer} variant="warning" index={2} />
            <StatCard label="Submitted Marks" value={stats?.submittedMarks} icon={Send} variant="accent" index={3} />
            <StatCard label="Approved Marks" value={stats?.approvedMarks} icon={CheckCircle2} variant="success" index={4} />
            <StatCard label="Rejected Marks" value={stats?.rejectedMarks} icon={XCircle} variant="danger" index={5} />
          </div>

          <div className="grid grid-2-wide">
            <Card>
              <div className="card-header">
                <h3>Recent Submissions</h3>
                <Link to="/teacher/submissions" style={{ fontSize: 13 }}>View all</Link>
              </div>
              <div className="card-body" style={{ padding: '10px 22px' }}>
                {recent.length ? (
                  recent.map((item, i) => (
                    <motion.div
                      key={item.id}
                      className="flex items-center justify-between"
                      style={{ padding: '13px 0', borderBottom: i < recent.length - 1 ? '1px solid var(--border)' : 'none', gap: 12 }}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{item.subject}</div>
                        <div className="muted" style={{ fontSize: 12 }}>{item.className} · {item.date}</div>
                      </div>
                      <StatusBadge status={item.status} />
                    </motion.div>
                  ))
                ) : (
                  <EmptyState title="No recent submissions" />
                )}
              </div>
            </Card>

            <Card>
              <div className="card-header">
                <h3>Quick Actions</h3>
              </div>
              <div className="card-body">
                <div className="flex flex-col" style={{ gap: 10 }}>
                  <Button variant="soft-primary" block onClick={() => navigate('/teacher/marks')}>
                    <PenLine size={16} /> Enter Marks
                  </Button>
                  <Button variant="outline" block onClick={() => navigate('/teacher/assignments')}>
                    My Assignments <ArrowRight size={16} />
                  </Button>
                  <Button variant="outline" block onClick={() => navigate('/teacher/rejected-marks')}>
                    Rejected Marks
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}