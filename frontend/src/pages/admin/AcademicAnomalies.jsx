import { useCallback, useEffect, useMemo, useState } from 'react'
import { ShieldAlert, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { anomalyService } from '../../services'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import StatCard from '../../components/ui/StatCard'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import { formatDateTime } from '../../utils/helpers'

const severityVariant = (s) => ({ high: 'danger', medium: 'warning', low: 'info' }[s] || 'neutral')
const statusVariant = (s) =>
  s === 'RESOLVED' ? 'success' : s === 'REVIEWING' ? 'info' : s === 'FLAGGED' ? 'warning' : 'danger'

export default function AcademicAnomalies() {
  const { toast } = useToast()
  const [anomalies, setAnomalies] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)
  const [combatMeta, setCombatMeta] = useState({ id: null, note: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [a, s] = await Promise.all([anomalyService.getAll(), anomalyService.getStats()])
      setAnomalies(a.data || [])
      setStats(s.data || null)
      setOffline(Boolean(a.offline) || Boolean(s.offline))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const sorted = useMemo(
    () => [...anomalies].sort((x, y) => (y.detectedAt || '').localeCompare(x.detectedAt || '')),
    [anomalies],
  )

  const handleResolve = async () => {
    if (!combatMeta.id) return
    setSaving(true)
    await anomalyService.resolve(combatMeta.id, combatMeta.note)
    setSaving(false)
    setCombatMeta({ id: null, note: '' })
    toast.success('Anomaly resolved', 'The anomaly was marked as resolved.')
    load()
  }

  return (
    <div>
      <PageHeader
        title="Academic Anomaly Detection"
        subtitle="Irregularities and outliers auto-detected across marks, attendance and submissions."
        actions={offline && <Badge variant="warning" dot>Demo/Offline</Badge>}
      />

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <StatCard index={0} label="Total Detected" value={stats?.total ?? '—'} icon={ShieldAlert} variant="primary" />
        <StatCard index={1} label="Unresolved" value={stats?.unresolved ?? '—'} icon={AlertTriangle} variant="danger" />
        <StatCard index={2} label="Under Review" value={stats?.reviewing ?? '—'} icon={RefreshCw} variant="warning" />
        <StatCard index={3} label="Resolved" value={stats?.resolved ?? '—'} icon={CheckCircle2} variant="success" />
      </div>

      <Card>
        <div className="card-body">
          {loading ? (
            <div className="skeleton" style={{ height: 120 }} />
          ) : sorted.length === 0 ? (
            <EmptyState icon={ShieldAlert} title="No anomalies" description="All signals are normal." />
          ) : (
            <div className="anomaly-list">
              {sorted.map((a) => (
                <div key={a.id} className={`anomaly-item ${a.status !== 'RESOLVED' ? 'open' : ''}`}>
                  <span className="stat-icon ic-danger" style={{ width: 40, height: 40 }}>
                    <ShieldAlert size={18} />
                  </span>
                  <div className="anomaly-item-body">
                    <div className="flex items-center" style={{ gap: 8 }}>
                      <span className="cell-main">{a.title}</span>
                      <Badge variant={severityVariant(a.severity)}>{a.severity}</Badge>
                      <Badge variant={statusVariant(a.status)}>{a.status.replace('_', ' ')}</Badge>
                    </div>
                    <div className="muted">{a.description}</div>
                    <div className="alert-item-meta">
                      {a.entity} · {a.className} · Detected {formatDateTime(a.detectedAt)}
                    </div>
                    {a.recommendation && <div className="anomaly-reco">Recommendation: {a.recommendation}</div>}
                  </div>
                  {a.status !== 'RESOLVED' && (
                    <Button size="sm" onClick={() => setCombatMeta({ id: a.id, note: '' })}>
                      <CheckCircle2 size={16} /> Resolve
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Modal open={Boolean(combatMeta.id)} onClose={() => setCombatMeta({ id: null, note: '' })} title="Resolve Anomaly">
        <div className="muted" style={{ marginBottom: 12 }}>
          Add a short note documenting how this anomaly was resolved.
        </div>
        <textarea
          className="form-control"
          rows={3}
          value={combatMeta.note}
          onChange={(e) => setCombatMeta((m) => ({ ...m, note: e.target.value }))}
          placeholder="e.g. Marks corrected and resubmitted after verification"
        />
        <div className="flex justify-between" style={{ gap: 10, marginTop: 12 }}>
          <Button variant="ghost" onClick={() => setCombatMeta({ id: null, note: '' })}>Cancel</Button>
          <Button onClick={handleResolve} loading={saving}><CheckCircle2 size={16} /> Mark Resolved</Button>
        </div>
      </Modal>
    </div>
  )
}
