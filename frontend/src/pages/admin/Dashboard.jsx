import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Users,
  GraduationCap,
  Building2,
  School,
  FileSpreadsheet,
  ClipboardList,
  CheckCircle2,
  Trophy,
  UserPlus,
  UserPlus2,
  BookOpen,
  ArrowRight,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { getGreeting } from '../../utils/helpers'
import { getStats } from '../../services/mock'
import StatCard from '../../components/ui/StatCard'
import Card from '../../components/ui/Card'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { SkeletonBlock } from '../../components/ui/Skeleton'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie, Legend } from 'recharts'

const PIE_COLORS = ['#3157D5', '#6C63FF', '#20B8D5', '#16A34A', '#F59E0B']

export default function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState(null)
  const [activity, setActivity] = useState([])
  const [distribution, setDistribution] = useState([])
  const [passFail, setPassFail] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const data = await getStats('admin')
        if (!mounted) return
        setStats(data.stats)
        setActivity(data.activity)
        setDistribution(data.distribution)
        setPassFail(data.passFail)
      } catch (e) {
        if (mounted) setError(e.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const quickActions = [
    { label: 'Add Student', icon: UserPlus, to: '/admin/students' },
    { label: 'Add Teacher', icon: UserPlus2, to: '/admin/teachers' },
    { label: 'Create Exam', icon: FileSpreadsheet, to: '/admin/exams' },
    { label: 'Create Subject', icon: BookOpen, to: '/admin/subjects' },
  ]

  const activityIcon = {
    submitted: 'badge-warning',
    approved: 'badge-success',
    added: 'badge-primary',
    created: 'badge-secondary',
    rejected: 'badge-danger',
  }

  return (
    <div>
      <PageHeader
        title={`${getGreeting()}, ${user?.name?.split(' ')[0] || 'Admin'} 👋`}
        subtitle="Here's what's happening across your institution today."
      />

      {loading ? (
        <div className="grid grid-4" style={{ marginBottom: 20 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} padded>
              <SkeletonBlock rows={3} height={16} />
            </Card>
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <>
          <div className="grid grid-4" style={{ marginBottom: 20 }}>
            <StatCard label="Total Students" value={stats?.totalStudents} icon={GraduationCap} variant="primary" index={0} />
            <StatCard label="Total Teachers" value={stats?.totalTeachers} icon={Users} variant="secondary" index={1} />
            <StatCard label="Total Departments" value={stats?.totalDepartments} icon={Building2} variant="accent" index={2} />
            <StatCard label="Total Classes" value={stats?.totalClasses} icon={School} variant="success" index={3} />
            <StatCard label="Active Exams" value={stats?.activeExams} icon={FileSpreadsheet} variant="warning" index={4} />
            <StatCard label="Pending Submissions" value={stats?.pendingSubmissions} icon={ClipboardList} variant="primary" index={5} />
            <StatCard label="Approved Results" value={stats?.approvedResults} icon={CheckCircle2} variant="success" index={6} />
            <StatCard label="Published Results" value={stats?.publishedResults} icon={Trophy} variant="accent" index={7} />
          </div>

          <div className="grid grid-2-main" style={{ marginBottom: 20 }}>
            <Card padded>
              <div className="flex items-center justify-between mb-4">
                <h3 className="card-title">Student Distribution</h3>
                <Link to="/admin/analytics" className="flex items-center gap-1" style={{ fontSize: 13 }}>
                  View all <ArrowRight size={14} />
                </Link>
              </div>
              {distribution.length ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={distribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F5" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#667085', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#667085', fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip cursor={{ fill: 'rgba(49,87,213,0.06)' }} contentStyle={{ borderRadius: 10, border: '1px solid #E6EAF0' }} />
                    <Bar dataKey="students" fill="#3157D5" radius={[6, 6, 0, 0]} maxBarSize={44} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState title="No distribution data" />
              )}
            </Card>

            <Card padded>
              <h3 className="card-title mb-4">Pass / Fail Overview</h3>
              {passFail.length ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={passFail} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3}>
                      {passFail.map((entry, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E6EAF0' }} />
                    <Legend wrapperStyle={{ fontSize: 13 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState title="No result data" />
              )}
            </Card>
          </div>

          <div className="grid grid-2-main">
            <Card>
              <div className="card-header">
                <h3>Recent Activity</h3>
                <Link to="/admin/notifications" style={{ fontSize: 13 }}>View all</Link>
              </div>
              <div className="card-body" style={{ padding: '10px 22px' }}>
                {activity.length ? (
                  activity.map((item, i) => (
                    <motion.div
                      key={item.id}
                      className="flex items-center justify-between"
                      style={{ padding: '13px 0', borderBottom: i < activity.length - 1 ? '1px solid var(--border)' : 'none', gap: 12 }}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <div className="flex items-center" style={{ gap: 12 }}>
                        <Badge variant={activityIcon[item.type] || 'muted'} dot />
                        <span style={{ fontSize: 13.5 }}>{item.text}</span>
                      </div>
                      <span className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{item.time}</span>
                    </motion.div>
                  ))
                ) : (
                  <EmptyState title="No recent activity" />
                )}
              </div>
            </Card>

            <Card>
              <div className="card-header">
                <h3>Quick Actions</h3>
              </div>
              <div className="card-body">
                <div className="grid grid-2-equal" style={{ gap: 12 }}>
                  {quickActions.map((action) => (
                    <button
                      key={action.label}
                      className="quick-action"
                      onClick={() => navigate(action.to)}
                    >
                      <span className="quick-action-icon">
                        <action.icon size={20} />
                      </span>
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: 20 }}>
                  <Button variant="outline" block onClick={() => navigate('/admin/results/verification')}>
                    Review Pending Results <ArrowRight size={16} />
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
