import { useEffect, useState } from 'react'
import { ScrollText, Search } from 'lucide-react'
import { getAuditLogs, ACTION_OPTIONS } from '../../services/mock'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import PageHeader from '../../components/ui/PageHeader'
import Filter from '../../components/ui/Filter'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import { formatDateTime } from '../../utils/helpers'

const roleVariant = { admin: 'primary', teacher: 'secondary', student: 'accent', system: 'muted' }

export default function AuditLogs() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [action, setAction] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const load = () => {
    setLoading(true)
    getAuditLogs({ search, role, action, from, to, page, pageSize }).then((res) => {
      setData(res.data)
      setTotal(res.total)
      setLoading(false)
    })
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, role, action, from, to, page])

  const columns = [
    { key: 'timestamp', header: 'Timestamp', render: (r) => <span className="muted">{formatDateTime(r.timestamp)}</span> },
    { key: 'actor', header: 'Actor', render: (r) => <span className="cell-main">{r.actor}</span> },
    { key: 'role', header: 'Role', render: (r) => <Badge variant={roleVariant[r.role] || 'muted'}>{r.role?.toUpperCase()}</Badge> },
    { key: 'action', header: 'Action', render: (r) => <Badge variant="neutral">{r.action}</Badge> },
    {
      key: 'entity',
      header: 'Target',
      render: (r) => (
        <div>
          <span className="cell-sub">{r.entity} · {r.entityId}</span>
        </div>
      ),
    },
    { key: 'ip', header: 'IP', render: (r) => <span className="muted">{r.ip}</span> },
  ]

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle="Immutable trail of security and verification actions across the system." />

      <Card>
        <div className="card-body" style={{ paddingBottom: 8 }}>
          <div className="flex" style={{ gap: 10, flexWrap: 'wrap' }}>
            <div className="search-bar" style={{ minWidth: 240 }}>
              <span className="search-icon"><Search size={16} /></span>
              <input value={search} onChange={(e) => { setPage(1); setSearch(e.target.value) }} placeholder="Search actor, entity, detail…" />
            </div>
            <Filter
              value={role}
              onChange={(v) => { setPage(1); setRole(v) }}
              options={[
                { value: 'admin', label: 'Admin' },
                { value: 'teacher', label: 'Teacher' },
                { value: 'student', label: 'Student' },
                { value: 'system', label: 'System' },
              ]}
            />
            <Filter
              value={action}
              onChange={(v) => { setPage(1); setAction(v) }}
              options={ACTION_OPTIONS.map((a) => ({ value: a, label: a[0] + a.slice(1).toLowerCase() }))}
            />
          </div>
          <div className="flex items-center" style={{ gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
            <span className="muted" style={{ fontSize: 12.5 }}>Date range</span>
            <input type="date" className="form-control" style={{ width: 'auto', padding: '8px 10px' }} value={from} onChange={(e) => { setPage(1); setFrom(e.target.value) }} aria-label="From date" />
            <span className="muted">–</span>
            <input type="date" className="form-control" style={{ width: 'auto', padding: '8px 10px' }} value={to} onChange={(e) => { setPage(1); setTo(e.target.value) }} aria-label="To date" />
          </div>
        </div>
        <div className="card-body" style={{ paddingTop: 8 }}>
          <Table columns={columns} data={data} loading={loading} empty={<EmptyState icon={ScrollText} title="No log entries" description="Try adjusting your filters." />} />
          <Pagination total={total} page={page} pageSize={pageSize} onPageChange={setPage} />
        </div>
      </Card>
    </div>
  )
}