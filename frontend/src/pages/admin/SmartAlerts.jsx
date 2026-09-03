import { useCallback, useEffect, useMemo, useState } from 'react'
import { BellRing, CheckCheck, X, AlertTriangle } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { alertService } from '../../services'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import StatCard from '../../components/ui/StatCard'
import EmptyState from '../../components/ui/EmptyState'
import { formatDateTime } from '../../utils/helpers'

const typeVariant = {
  danger: 'danger',
  warning: 'warning',
  success: 'success',
  info: 'primary',
}

const iconFor = (type) =>
  type === 'danger' ? 'ic-danger' : type === 'warning' ? 'ic-warning' : type === 'success' ? 'ic-success' : 'ic-primary'

export default function SmartAlerts() {
  const { toast } = useToast()
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await alertService.getAll()
      setAlerts(res.data || [])
      setOffline(Boolean(res.offline))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const unread = useMemo(() => alerts.filter((a) => !a.read).length, [alerts])
  const high = useMemo(() => alerts.filter((a) => a.type === 'danger').length, [alerts])
  const sorted = useMemo(
    () => [...alerts].sort((a, b) => (b.time || '').localeCompare(a.time || '')),
    [alerts],
  )

  const handleRead = async (id) => {
    await alertService.markRead(id)
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)))
  }

  const handleReadAll = async () => {
    await alertService.markAllRead()
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })))
    toast.success('Alerts marked read', 'All alerts have been marked as read.')
  }

  const handleDismiss = async (id) => {
    await alertService.dismiss(id)
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <div>
      <PageHeader
        title="Smart Alert Engine"
        subtitle="Operational alerts generated from live exam, attendance and verification signals."
        actions={
          <>
            {offline && <Badge variant="warning" dot>Demo/Offline</Badge>}
            <Button variant="ghost" onClick={handleReadAll}><CheckCheck size={18} /> Mark all read</Button>
          </>
        }
      />

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <StatCard index={0} label="Total Alerts" value={alerts.length} icon={BellRing} variant="primary" />
        <StatCard index={1} label="Unread" value={unread} icon={BellRing} variant="warning" />
        <StatCard index={2} label="High Priority" value={high} icon={AlertTriangle} variant="danger" />
        <StatCard index={3} label="Read" value={alerts.length - unread} icon={CheckCheck} variant="success" />
      </div>

      <Card>
        <div className="card-body">
          {loading ? (
            <div className="skeleton" style={{ height: 120 }} />
          ) : sorted.length === 0 ? (
            <EmptyState icon={BellRing} title="No alerts" description="You're all caught up." />
          ) : (
            <div className="alert-list">
              {sorted.map((a) => (
                <div key={a.id} className={`alert-item ${!a.read ? 'unread' : ''}`}>
                  <span className={`stat-icon ${iconFor(a.type)}`} style={{ width: 40, height: 40 }}>
                    <BellRing size={18} />
                  </span>
                  <div className="alert-item-body">
                    <div className="flex items-center" style={{ gap: 8 }}>
                      <span className="cell-main">{a.title}</span>
                      <Badge variant={typeVariant[a.type] || 'neutral'}>{a.type}</Badge>
                    </div>
                    <div className="muted">{a.text}</div>
                    <div className="alert-item-meta">{a.source} · {a.scope} · {formatDateTime(a.time)}</div>
                  </div>
                  <div className="flex" style={{ gap: 6 }}>
                    {!a.read && (
                      <Button size="sm" variant="ghost" onClick={() => handleRead(a.id)}>
                        <CheckCheck size={16} /> Read
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => handleDismiss(a.id)} aria-label="Dismiss">
                      <X size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
