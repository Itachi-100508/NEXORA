import { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2, LayoutGrid, Eye } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { seatingService } from '../../services'
import { seatingClasses } from '../../services/mock'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Table from '../../components/ui/Table'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import Select from '../../components/ui/Select'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { formatDate, formatDateTime } from '../../utils/helpers'

export default function SeatingArrangement() {
  const { toast } = useToast()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)
  const [genOpen, setGenOpen] = useState(false)
  const [viewPlan, setViewPlan] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState({ classId: 1, division: 'A' })

  const divisionsFor = seatingClasses.find((c) => c.id === Number(form.classId))?.division || 'A'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await seatingService.getAll()
      setPlans(res.data || [])
      setOffline(Boolean(res.offline))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleGenerate = async () => {
    setSaving(true)
    const res = await seatingService.generate(form)
    setSaving(false)
    setGenOpen(false)
    toast.success('Seating plan generated', 'The seating arrangement was created.')
    if (res?.data?.plan) {
      setViewPlan(res.data.plan)
    }
    load()
  }

  const handleDelete = async () => {
    await seatingService.remove(deleteId)
    setDeleteId(null)
    toast.success('Plan removed', 'The seating plan was deleted.')
    load()
  }

  const columns = [
    { key: 'className', header: 'Class', render: (r) => <span className="cell-main">{r.className}</span> },
    { key: 'division', header: 'Division', render: (r) => <Badge variant="primary">{r.division}</Badge> },
    { key: 'subjectLabel', header: 'Exam', render: (r) => <span className="muted">{r.subjectLabel}</span> },
    { key: 'totalStudents', header: 'Students', render: (r) => <span className="muted">{r.totalStudents}</span> },
    { key: 'rooms', header: 'Rooms', render: (r) => <span className="muted">{r.rooms?.length || 0}</span> },
    { key: 'generatedAt', header: 'Generated', render: (r) => <span className="muted">{formatDateTime(r.generatedAt)}</span> },
    {
      key: 'actions',
      header: '',
      style: { textAlign: 'right' },
      render: (row) => (
        <div className="flex" style={{ gap: 6, justifyContent: 'flex-end' }}>
          <button className="icon-btn" onClick={() => setViewPlan(row)} aria-label="View"><Eye size={16} /></button>
          <button className="icon-btn" onClick={() => setDeleteId(row.id)} aria-label="Delete"><Trash2 size={16} /></button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Seating Arrangement"
        subtitle={`Exam seating plans ${plans.length ? `(${plans.length} plans)` : ''}.`}
        actions={
          <>
            {offline && <Badge variant="warning" dot>Demo/Offline</Badge>}
            <Button onClick={() => setGenOpen(true)}><Plus size={18} /> Generate Plan</Button>
          </>
        }
      />

      <Card>
        <div className="card-body">
          <Table
            columns={columns}
            data={plans}
            loading={loading}
            empty={
              <EmptyState
                icon={LayoutGrid}
                title="No seating plans"
                description="Generate an exam seating arrangement for a class."
                action={<Button onClick={() => setGenOpen(true)}><Plus size={16} /> Generate Plan</Button>}
              />
            }
          />
        </div>
      </Card>

      <Modal open={genOpen} onClose={() => setGenOpen(false)} title="Generate Seating Plan">
        <Select
          label="Class"
          value={form.classId}
          onChange={(e) => setForm({ ...form, classId: Number(e.target.value) })}
        >
          {seatingClasses.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <Select label="Division" value={divisionsFor} onChange={(e) => setForm({ ...form, division: e.target.value })}>
          <option value="A">Division A</option>
          <option value="B">Division B</option>
          <option value="C">Division C</option>
        </Select>
        <div className="muted" style={{ fontSize: 13, marginBottom: 4 }}>
          This will arrange all students into a row/column grid and split them across rooms automatically.
        </div>
        <div className="flex justify-between" style={{ gap: 10 }}>
          <Button variant="ghost" onClick={() => setGenOpen(false)}>Cancel</Button>
          <Button onClick={handleGenerate} loading={saving}>Generate Plan</Button>
        </div>
      </Modal>

      <Modal open={Boolean(viewPlan)} onClose={() => setViewPlan(null)} title={viewPlan ? `Seating - ${viewPlan.className}` : ''} size="lg">
        {viewPlan && (
          <div>
            <div className="flex items-center justify-between" style={{ gap: 10, marginBottom: 16 }}>
              <div className="muted">
                {viewPlan.subjectLabel} · {formatDate(viewPlan.generatedAt)} · {viewPlan.totalStudents} students / {viewPlan.capacity} capacity
              </div>
              <Badge variant="success" dot>Ready</Badge>
            </div>
            {viewPlan.rooms?.map((room) => (
              <div key={room.roomId} className="room-block">
                <div className="room-head">{room.name} · {room.rows} rows × {room.cols} cols</div>
                <div className="seating-grid" style={{ gridTemplateColumns: `repeat(${room.cols}, 1fr)` }}>
                  {room.layout.map((cell, i) => (
                    <div key={i} className={`seat-cell ${cell.student ? 'filled' : 'empty'}`} title={cell.student ? `${cell.student.rollNumber} · ${cell.student.name}` : 'Empty'}>
                      <div className="seat-code">{cell.seat}</div>
                      {cell.student ? <div className="seat-roll">{cell.student.rollNumber}</div> : <div className="seat-roll muted">—</div>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete this seating plan?"
        description="This will permanently remove the generated seating arrangement."
        confirmLabel="Delete"
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
