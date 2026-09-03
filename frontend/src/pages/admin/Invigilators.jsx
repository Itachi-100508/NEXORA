import { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2, UserCheck } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { invigilatorService } from '../../services'
import { invigilatorTeachers, invigilatorExams } from '../../services/mock'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import StatCard from '../../components/ui/StatCard'
import Table from '../../components/ui/Table'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import Select from '../../components/ui/Select'
import Input from '../../components/ui/Input'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { formatDate } from '../../utils/helpers'

export default function Invigilators() {
  const { toast } = useToast()
  const [roster, setRoster] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    examId: 32,
    examName: 'Mid Semester Examination - Sem 4',
    teacherId: 14,
    date: '2026-09-14',
    slot: '10:30 - 13:30',
    room: 'Hall A',
    role: 'Invigilator',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rosterRes, statsRes] = await Promise.all([
        invigilatorService.getRoster(),
        invigilatorService.getStats(),
      ])
      setRoster(rosterRes.data || [])
      setStats(statsRes.data || null)
      setOffline(Boolean(rosterRes.offline) || Boolean(statsRes.offline))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleAdd = async () => {
    setSaving(true)
    await invigilatorService.addDuty(form)
    setSaving(false)
    setModalOpen(false)
    toast.success('Duty assigned', `${form.room} duty was assigned.`)
    load()
  }

  const handleDelete = async () => {
    await invigilatorService.removeDuty(deleteId)
    setDeleteId(null)
    toast.success('Duty removed', 'The invigilation duty was removed.')
    load()
  }

  const columns = [
    {
      key: 'teacherName',
      header: 'Invigilator',
      render: (r) => (
        <div className="flex items-center" style={{ gap: 12 }}>
          <span className="stat-icon ic-primary" style={{ width: 38, height: 38 }}>
            <UserCheck size={18} />
          </span>
          <div>
            <div className="cell-main">{r.teacherName}</div>
            <div className="muted">{r.role}</div>
          </div>
        </div>
      ),
    },
    { key: 'examName', header: 'Exam', render: (r) => <span className="muted">{r.examName}</span> },
    { key: 'date', header: 'Date', render: (r) => <span className="muted">{formatDate(r.date)}</span> },
    { key: 'slot', header: 'Slot', render: (r) => <span className="muted">{r.slot || '—'}</span> },
    { key: 'room', header: 'Room', render: (r) => <Badge variant="primary">{r.room}</Badge> },
    {
      key: 'actions',
      header: '',
      style: { textAlign: 'right' },
      render: (row) => (
        <div className="flex" style={{ gap: 6, justifyContent: 'flex-end' }}>
          <button className="icon-btn" onClick={() => setDeleteId(row.id)} aria-label="Remove"><Trash2 size={16} /></button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Invigilation Management"
        subtitle="Assign and track invigilator duties across exams and rooms."
        actions={
          <>
            {offline && <Badge variant="warning" dot>Demo/Offline</Badge>}
            <Button onClick={() => setModalOpen(true)}><Plus size={18} /> Assign Duty</Button>
          </>
        }
      />

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <StatCard index={0} label="Total Duties" value={stats?.totalDuties ?? '—'} icon={UserCheck} variant="primary" />
        <StatCard index={1} label="Assigned Staff" value={stats?.assignedStaff ?? '—'} icon={UserCheck} variant="accent" />
        <StatCard index={2} label="Active Room Slots" value={stats?.activeRooms ?? '—'} icon={UserCheck} variant="success" />
        <StatCard index={3} label="Chief Invigilators" value={stats?.chiefs ?? '—'} icon={UserCheck} variant="warning" />
      </div>

      <Card>
        <div className="card-body">
          <Table
            columns={columns}
            data={roster}
            loading={loading}
            empty={
              <EmptyState
                icon={UserCheck}
                title="No duties assigned"
                description="Assign invigilators to exams and rooms."
                action={<Button onClick={() => setModalOpen(true)}><Plus size={16} /> Assign Duty</Button>}
              />
            }
          />
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Assign Invigilation Duty">
        <Select
          label="Exam"
          value={form.examId}
          onChange={(e) => {
            const exam = invigilatorExams.find((x) => x.id === Number(e.target.value))
            setForm({ ...form, examId: Number(e.target.value), examName: exam ? exam.name : 'General' })
          }}
        >
          {invigilatorExams.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </Select>
        <Select
          label="Invigilator"
          value={form.teacherId}
          onChange={(e) => setForm({ ...form, teacherId: Number(e.target.value) })}
        >
          {invigilatorTeachers.map((t) => (
            <option key={t.id} value={t.id}>{t.name} · {t.department}</option>
          ))}
        </Select>
        <div className="grid grid-2">
          <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input label="Slot" value={form.slot} onChange={(e) => setForm({ ...form, slot: e.target.value })} placeholder="10:30 - 13:30" />
        </div>
        <div className="grid grid-2">
          <Input label="Room" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} placeholder="Hall A" />
          <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="Invigilator">Invigilator</option>
            <option value="Chief Invigilator">Chief Invigilator</option>
          </Select>
        </div>
        <div className="flex justify-between" style={{ gap: 10 }}>
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleAdd} loading={saving}>Assign Duty</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Remove this duty?"
        description="This will remove the invigilator duty from the roster."
        confirmLabel="Remove"
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
