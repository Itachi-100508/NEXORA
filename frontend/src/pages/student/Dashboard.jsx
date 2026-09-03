import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GraduationCap, Award, Gauge, FileText, Download, ChevronRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getStats } from '../../services/mock'
import { getGreeting } from '../../utils/helpers'
import StatCard from '../../components/ui/StatCard'
import Card from '../../components/ui/Card'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import StatusBadge from '../../components/ui/StatusBadge'
import { SkeletonBlock } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'

export default function StudentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [previous, setPrevious] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    getStats('student').then((res) => {
      if (!mounted) return
      setStats(res.stats)
      setPrevious(res.previousResults)
      setLoading(false)
    })
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div>
      <PageHeader
        title={`${getGreeting()}, ${user?.name?.split(' ')[0] || 'Student'} 👋`}
        subtitle={`${user?.rollNumber || ''} · ${user?.className || ''} · ${user?.department || ''}`}
      />

      <Card style={{ marginBottom: 20, overflow: 'hidden' }}>
        <div className="welcome-banner">
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>Examination Results Portal</h2>
            <p style={{ fontSize: 13.5, marginTop: 6, opacity: 0.85, maxWidth: 460 }}>
              View your latest published results, download marksheets and verify result authenticity with QR codes.
            </p>
            <div className="flex" style={{ gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
              <Button onClick={() => navigate('/student/results')}>
                <FileText size={16} /> View Result
              </Button>
              <Button variant="outline" onClick={() => navigate('/student/marksheet')}>
                <Download size={16} /> Download Marksheet
              </Button>
              <Button variant="soft-primary" onClick={() => navigate('/student/journey')}>
                <GraduationCap size={16} /> Academic Journey
              </Button>
            </div>
          </div>
          <div className="welcome-art">
            <GraduationCap size={80} />
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="grid grid-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} padded><SkeletonBlock rows={3} height={16} /></Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-4" style={{ marginBottom: 20 }}>
            <StatCard label="Latest CGPA" value={stats?.latestCgpa} icon={Award} variant="primary" index={0} />
            <StatCard label="Latest Percentage" value={`${stats?.latestPercentage}%`} icon={Gauge} variant="success" index={1} />
            <StatCard label="Result Status" value={stats?.resultStatus} icon={FileText} variant="accent" index={2} />
            <StatCard label="Current Semester" value={`Sem ${stats?.currentSemester}`} icon={GraduationCap} variant="secondary" index={3} />
          </div>

          <Card>
            <div className="card-header">
              <h3>Previous Results</h3>
              <Link to="/student/history" style={{ fontSize: 13 }}>View all</Link>
            </div>
            <div className="card-body" style={{ padding: '10px 22px' }}>
              {previous.length ? (
                previous.map((r, i) => (
                  <motion.div
                    className="flex items-center justify-between"
                    key={r.id}
                    style={{ padding: '13px 0', borderBottom: i < previous.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/student/results/${r.id}`)}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>Semester {r.semester}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{r.academicYear}</div>
                    </div>
                    <div className="flex items-center" style={{ gap: 16 }}>
                      <span style={{ fontSize: 13 }}>{r.percentage}%</span>
                      <Badge variant="secondary">CGPA {r.cgpa}</Badge>
                      <StatusBadge status={r.status} />
                      <ChevronRight size={16} className="muted" />
                    </div>
                  </motion.div>
                ))
              ) : (
                <EmptyState title="No results published yet" />
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}