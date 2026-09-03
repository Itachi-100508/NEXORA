import { useCallback, useEffect, useState } from 'react'
import { UserCheck, CalendarDays } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { invigilatorService } from '../../services'
import PageHeader from '../../components/ui/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate } from '../../utils/helpers'

export default function TeacherInvigilation() {
  const { user } = useAuth()
  const [duties, setDuties] = useState([])
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await invigilatorService.getTeacherDuties(user?.id)
      setDuties(res.data || [])
      setOffline(Boolean(res.offline))
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    load()
  }, [load])

  const sorted = [...duties].sort((a, b) => (a.date || '').localeCompare(b.date || ''))

  return (
    <div>
      <PageHeader
        title="My Invigilation Duties"
        subtitle={`Upcoming invigilation assignments for ${user?.name || 'you'}.`}
        actions={offline && <Badge variant="warning" dot>Demo/Offline</Badge>}
      />

      {loading ? (
        <Card><div className="card-body"><div className="skeleton" style={{ height: 120 }} /></div></Card>
      ) : sorted.length === 0 ? (
        <Card>
          <div className="card-body">
            <EmptyState
              icon={UserCheck}
              title="No invigilation duties assigned"
              description="Any invigilation duties assigned to you will appear here."
            />
          </div>
        </Card>
      ) : (
        <div className="grid grid-2">
          {sorted.map((d) => (
            <Card key={d.id} padded>
              <div className="duty-card">
                <span className="stat-icon ic-primary" style={{ width: 42, height: 42 }}>
                  <CalendarDays size={20} />
                </span>
                <div className="duty-card-body">
                  <div className="cell-main">{d.examName}</div>
                  <div className="muted">{formatDate(d.date)} · {d.slot}</div>
                  <div className="flex" style={{ gap: 8, marginTop: 8 }}>
                    <Badge variant="primary">{d.room}</Badge>
                    <Badge variant={d.role === 'Chief Invigilator' ? 'warning' : 'secondary'}>{d.role}</Badge>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
