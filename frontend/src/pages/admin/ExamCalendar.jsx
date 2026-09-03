import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, CalendarDays } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { examCalendarService } from '../../services'
import { calendarSubjects } from '../../services/mock'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Table from '../../components/ui/Table'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { formatDate } from '../../utils/helpers'

const typeVariant = {
  theory: 'primary',
  practical: 'accent',
  viva: 'info',
  result: 'success',
  deadline: 'warning',
}

const emptyForm = {
  title: '',
  type: 'theory',
  subject: '',
  className: 'SE-I B',
  date: '',
  slot: '',
  venue: '',
}

export default function ExamCalendar() {
  const { toast } = useToast()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [deleteId, setDeleteId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await examCalendarService.getAll()
      setEvents(res.data || [])
      setOffline(Boolean(res.offline))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const sorted = useMemo(
    () => [...events].sort((a, b) => (a.date || '').localeCompare(b.date || '')),
    [events],
  )

  const openAdd = () => {
    setEditId(null)
    setForm(emptyForm)
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (row) => {
    setEditId(row.id)
    setForm({
      title: row.title,
      type: row.type,
      subject: row.subject || '',
      className: row.className,
      date: row.date,
      slot: row.slot || '',
      venue: row.venue || '',
    })
    setErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const next = {}
    if (!form.title.trim()) next.title = 'Title is required.'
    if (!form.date) next.date = 'Date is required.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    if (editId) {
      await examCalendarService.update(editId, form)
      toast.success('Event updated', `${form.title} was updated.`)
    } else {
      await examCalendarService.create(form)
      toast.success('Event added', `${form.title} was added to the calendar.`)
    }
    setModalOpen(false)
    load()
  }

  const handleDelete = async () => {
    await examCalendarService.remove(deleteId)
    setDeleteId(null)
    toast.success('Event removed', 'The calendar event was removed.')
    load()
  }

  const columns = [
    {
      key: 'title',
      header: 'Event',
      render: (r) => (
        <div className="flex items-center" style={{ gap: 12 }}>
          <span className="stat-icon ic-primary" style={{ width: 38, height: 38 }}>
            <CalendarDays size={18} />
          </span>
          <div>
            <div className="cell-main">{r.title}</div>
            <div className="muted">{r.subject || r.type}</div>
          </div>
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (r) => <Badge variant={typeVariant[r.type] || 'neutral'}>{r.type}</Badge> },
    { key: 'className', header: 'Class', render: (r) => <span className="muted">{r.className}</span> },
    { key: 'date', header: 'Date', render: (r) => <span className="muted">{formatDate(r.date)}</span> },
    { key: 'slot', header: 'Slot', render: (r) => <span className="muted">{r.slot || '—'}</span> },
    { key: 'venue', header: 'Venue', render: (r) => <span className="muted">{r.venue || '—'}</span> },
    {
      key: 'actions',
      header: '',
      style: { textAlign: 'right' },
      render: (row) => (
        <div className="flex" style={{ gap: 6, justifyContent: 'flex-end' }}>
          <button className="icon-btn" onClick={() => openEdit(row)} aria-label="Edit"><Pencil size={16} /></button>
          <button className="icon-btn" onClick={() => setDeleteId(row.id)} aria-label="Delete"><Trash2 size={16} /></button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Examination Calendar"
        subtitle={`Timetable of exams and milestones ${events.length ? `(${events.length} events)` : ''}.`}
        actions={
          <>
            {offline && <Badge variant="warning" dot>Demo/Offline</Badge>}
            <Button onClick={openAdd}><Plus size={18} /> Add Event</Button>
          </>
        }
      />

      <Card>
        <div className="card-body">
          <Table
            columns={columns}
            data={sorted}
            loading={loading}
            empty={
              <EmptyState
                icon={CalendarDays}
                title="No calendar events"
                description="Add exam dates, milestones and deadlines."
                action={<Button onClick={openAdd}><Plus size={16} /> Add Event</Button>}
              />
            }
          />
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Event' : 'Add Calendar Event'}>
        <Input label="Event Title" value={form.title} required onChange={(e) => setForm({ ...form, title: e.target.value })} error={errors.title} placeholder="e.g. Data Structures - Theory" />
        <div className="grid grid-2">
          <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="theory">Theory</option>
            <option value="practical">Practical</option>
            <option value="viva">Viva</option>
            <option value="result">Result</option>
            <option value="deadline">Deadline</option>
          </Select>
          <Select label="Class" value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })}>
            {['SE-I B', 'TE-II A', 'BE-I C', 'All'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </div>
        <Select label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
          <option value="">— None —</option>
          {calendarSubjects.map((s) => (
            <option key={s.id} value={s.name}>{s.name} ({s.code})</option>
          ))}
        </Select>
        <div className="grid grid-2">
          <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} error={errors.date} />
          <Input label="Time Slot" value={form.slot} onChange={(e) => setForm({ ...form, slot: e.target.value })} placeholder="10:30 - 13:30" />
        </div>
        <Input label="Venue" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Hall A" />
        <div className="flex justify-between" style={{ gap: 10 }}>
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>{editId ? 'Update Event' : 'Add Event'}</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Remove this event?"
        description="This will permanently remove the calendar event."
        confirmLabel="Remove"
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
