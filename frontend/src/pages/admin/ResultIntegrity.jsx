import { useCallback, useEffect, useMemo, useState } from 'react'
import { ShieldCheck, GitBranch, FileCheck, ArrowRight } from 'lucide-react'
import { resultVersionService, integrityService } from '../../services'
import PageHeader from '../../components/ui/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Select from '../../components/ui/Select'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonBlock } from '../../components/ui/Skeleton'
import { formatDateTime } from '../../utils/helpers'

const versionStatusVariant = {
  PUBLISHED: 'success',
  CHANGED: 'warning',
  DRAFT: 'muted',
}

export default function ResultIntegrity() {
  const [results, setResults] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [entry, setEntry] = useState(null)
  const [fromV, setFromV] = useState('')
  const [toV, setToV] = useState('')
  const [diff, setDiff] = useState(null)
  const [integrity, setIntegrity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)

  const loadResults = useCallback(async () => {
    setLoading(true)
    try {
      const res = await resultVersionService.getAll()
      setResults(res.data || [])
      setOffline(Boolean(res.offline))
      if (res.data?.length && !selectedId) setSelectedId(String(res.data[0].resultId))
    } finally {
      setLoading(false)
    }
  }, [selectedId])

  useEffect(() => {
    loadResults()
  }, [loadResults])

  useEffect(() => {
    if (!selectedId) return
    let mounted = true
    setEntry(null)
    setDiff(null)
    resultVersionService.getByResultId(selectedId).then((res) => {
      if (!mounted) return
      setEntry(res.data)
      const vs = (res.data?.versions || []).map((v) => v.version)
      if (vs.length >= 2) {
        setFromV(String(vs[0]))
        setToV(String(vs[vs.length - 1]))
      }
    })
    integrityService.getSummary(selectedId).then((res) => {
      if (mounted) setIntegrity(res.data)
    })
    return () => {
      mounted = false
    }
  }, [selectedId])

  useEffect(() => {
    if (!selectedId || !fromV || !toV || fromV === toV) {
      setDiff(null)
      return
    }
    let mounted = true
    resultVersionService.getDiff(selectedId, fromV, toV).then((res) => {
      if (mounted) setDiff(res.data === null ? null : res.data)
    })
    return () => {
      mounted = false
    }
  }, [selectedId, fromV, toV])

  const versions = entry?.versions || []
  const versionOptions = versions.map((v) => ({ label: `Version ${v.version} — ${v.status}`, value: String(v.version) }))

  if (loading) {
    return (
      <div className="grid grid-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} padded><SkeletonBlock rows={4} height={16} /></Card>
        ))}
      </div>
    )
  }

  if (!results.length) {
    return <Card><div className="card-body"><EmptyState icon={GitBranch} title="No versioned results" description="No result version data available." /></div></Card>
  }

  return (
    <div>
      <PageHeader
        title="Result Versioning & Integrity"
        subtitle="Track every change to a published result with a full audit of reason, author and diff."
        actions={
          <>
            {offline && <Badge variant="warning" dot>Demo/Offline</Badge>}
            <Select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              {results.map((r) => (
                <option key={r.resultId} value={String(r.resultId)}>{r.studentName} · Sem {r.semester} · {r.exam}</option>
              ))}
            </Select>
          </>
        }
      />

      {!entry ? (
        <Card><div className="card-body"><EmptyState icon={GitBranch} title="No versions" description="Select a result to view version history." /></div></Card>
      ) : (
        <>
          <Card style={{ marginBottom: 16 }}>
            <div className="card-body">
              <div className="flex items-center" style={{ gap: 12, flexWrap: 'wrap' }}>
                <ShieldCheck size={28} color="var(--success)" />
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div className="flex items-center" style={{ gap: 8 }}>
                    <b style={{ fontSize: 16 }}>{entry.studentName}</b>
                    <Badge variant={versionStatusVariant[entry.status] || 'neutral'}>{entry.status}</Badge>
                  </div>
                  <div className="muted" style={{ fontSize: 13 }}>{entry.rollNumber} · Semester {entry.semester} · {entry.exam}</div>
                </div>
                <div className="flex" style={{ gap: 24 }}>
                  <div className="text-center">
                    <div className="muted" style={{ fontSize: 12 }}>Verification ID</div>
                    <b style={{ fontSize: 14 }}>{entry.verificationId}</b>
                  </div>
                  <div className="text-center">
                    <div className="muted" style={{ fontSize: 12 }}>Current Version</div>
                    <b>v{entry.currentVersion}</b>
                  </div>
                  <div className="text-center">
                    <div className="muted" style={{ fontSize: 12 }}>Issue</div>
                    <b>{entry.issuedAt}</b>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-2-wide" style={{ marginBottom: 20 }}>
            <Card>
              <div className="card-header"><h3>Version History</h3></div>
              <div className="card-body" style={{ padding: '10px 22px' }}>
                {[...versions].reverse().map((v, idx) => (
                  <div key={v.version} className="flex items-center justify-between" style={{ padding: '13px 0', borderBottom: idx < versions.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>Version {v.version} {v.version === entry.currentVersion && <Badge variant="accent">Current</Badge>}</div>
                      <div className="muted" style={{ fontSize: 12.5 }}>{formatDateTime(v.date)} · {v.changedBy}</div>
                      <div style={{ fontSize: 13, marginTop: 4 }}>{v.reason}</div>
                    </div>
                    <Badge variant={versionStatusVariant[v.status] || 'neutral'}>{v.status}</Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="card-header"><h3>Integrity Panel</h3></div>
              <div className="card-body">
                {integrity ? (
                  <div className="flex flex-col" style={{ gap: 14 }}>
                    <div className="flex items-center" style={{ gap: 10 }}>
                      <FileCheck size={30} color="var(--success)" />
                      <div>
                        <div style={{ fontWeight: 700 }}>Digitally Verified by EXAMORA</div>
                        <Badge variant="warning">Demo Verification</Badge>
                      </div>
                    </div>
                    <div className="grid grid-2" style={{ gap: 10 }}>
                      {[
                        { k: 'Verification ID', v: integrity.verificationId },
                        { k: 'Current Version', v: `v${integrity.version}` },
                        { k: 'Issue Date', v: integrity.issuedAt },
                        { k: 'Result Status', v: integrity.status },
                        { k: 'Integrity', v: integrity.integrity },
                        { k: 'Verification Mode', v: integrity.verification === 'demo' ? 'Demo' : integrity.verification },
                      ].map((x) => (
                        <div key={x.k} style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '9px 12px' }}>
                          <div className="muted" style={{ fontSize: 11.5 }}>{x.k}</div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{x.v}</div>
                        </div>
                      ))}
                    </div>
                    <div className="muted" style={{ fontSize: 12.5, padding: 10, background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)' }}>
                      This is a demonstration verification. No cryptographic signature is claimed. Real verification is shown in the QR Result Verification flow.
                    </div>
                  </div>
                ) : (
                  <EmptyState icon={ShieldCheck} title="No integrity data" description="Integrity summary not available for this result." />
                )}
              </div>
            </Card>
          </div>

          <div className="grid grid-2-wide">
            <Card>
              <div className="card-header">
                <h3>Version Timeline</h3>
              </div>
              <div className="card-body">
                <ul className="status-timeline">
                  {versions.map((v) => (
                    <li key={v.version} className="timeline-item done">
                      <span className="timeline-dot" />
                      <div className="flex justify-between gap-2" style={{ alignItems: 'baseline' }}>
                        <div className="timeline-label">Version {v.version} — {v.status}</div>
                        <div className="timeline-time">{formatDateTime(v.date)}</div>
                      </div>
                      <div className="timeline-note">{v.reason} · by {v.changedBy}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            <Card>
              <div className="card-header"><h3>Change Diff</h3></div>
              <div className="card-body">
                <div className="grid grid-2" style={{ gap: 10, marginBottom: 12 }}>
                  <Select label="From Version" value={fromV} onChange={(e) => setFromV(e.target.value)}>
                    {versionOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Select>
                  <Select label="To Version" value={toV} onChange={(e) => setToV(e.target.value)}>
                    {versionOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Select>
                </div>

                {!diff ? (
                  <div className="muted" style={{ fontSize: 13 }}>Select two different versions to compare subject-level changes.</div>
                ) : (
                  <>
                    <div className="flex" style={{ gap: 18, marginBottom: 12, flexWrap: 'wrap' }}>
                      <div><span className="muted" style={{ fontSize: 12 }}>Percentage</span> <b>{diff.oldPercentage}%</b> <ArrowRight size={14} className="muted" /> <b style={{ color: diff.newPercentage >= diff.oldPercentage ? 'var(--success)' : 'var(--danger)' }}>{diff.newPercentage}%</b></div>
                      <div><span className="muted" style={{ fontSize: 12 }}>CGPA</span> <b>{diff.oldCgpa}</b> <ArrowRight size={14} className="muted" /> <b style={{ color: diff.newCgpa >= diff.oldCgpa ? 'var(--success)' : 'var(--danger)' }}>{diff.newCgpa}</b></div>
                    </div>
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Subject</th>
                            <th>Old Marks</th>
                            <th>New Marks</th>
                            <th>Difference</th>
                          </tr>
                        </thead>
                        <tbody>
                          {diff.subjects.map((s) => (
                            <tr key={s.subject}>
                              <td>{s.subject}</td>
                              <td>{s.oldMarks ?? '—'}</td>
                              <td>{s.newMarks ?? '—'}</td>
                              <td>
                                {s.diff === null || s.diff === undefined ? (
                                  '—'
                                ) : (
                                  <span style={{ color: s.diff > 0 ? 'var(--success)' : s.diff < 0 ? 'var(--danger)' : 'var(--muted)' }}>
                                    {s.diff > 0 ? '+' : ''}{s.diff}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
