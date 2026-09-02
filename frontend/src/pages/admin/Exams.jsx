import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, FileSpreadsheet, Pencil, Eye, Power } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { getExams } from '../../services/mock'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import SearchBar from '../../components/ui/SearchBar'
import Filter from '../../components/ui/Filter'
import Pagination from '../../components/ui/Pagination'
import StatusBadge from '../../components/ui/StatusBadge'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import { formatDate } from '../../utils/helpers'

const PAGE_SIZE = 8
const emptyForm = { name: '', semester: 3, academicYear: '2025-2026', startDate: '', endDate: '' }

export default function Exams() {
  const { toast } = useToast()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [toggleId, setToggleId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await getExams({ search })
    setData(res.data)
    setLoading(false)
  }, [search])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  const filtered = useMemo(() => {
    let list = data
    const q = search.trim().toLowerCase()
    if (q) list = list.filter((e) => e.name.toLowerCase().includes(q))
    if (status) list = list.filter((e) => e.status === status)
    return list
  }, [data, search, status])

  const total = filtered.length
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const openAdd = () => {
    setEditId(null)
    setForm(emptyForm)
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (row) => {
    setEditId(row.id)
    setForm({ name: row.name, semester: row.semester, academicYear: row.academicYear, startDate: row.startDate, endDate: row.endDate })
    setErrors({})
    setModalOpen(true)
  }

  const openView = (row) => {
    setSelected(row)
    setViewOpen(true)
  }

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Exam name is required.'
    if (!form.startDate) next.startDate = 'Start date is required.'
    if (!form.endDate) next.endDate = 'End date is required.'
    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
      next.endDate = 'End date cannot be before start date.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    setSaving(true)
    setTimeout(() => {
      if (editId) {
        setData((prev) => prev.map((e) => (e.id === editId ? { ...e, ...form } : e)))
        toast.success('Exam updated', `${form.name} was updated.`)
      } else {
        setData((prev) => [...prev, { id: Date.now(), ...form, status: 'UPCOMING' }])
        toast.success('Exam created', `${form.name} was created.`)
      }
      setSaving(false)
      setModalOpen(false)
    }, 600)
  }

  const handleToggle = () => {
    const exam = data.find((e) => e.id === toggleId)
    setData((prev) => prev.map((e) => (e.id === toggleId ? { ...e, status: e.status === 'ACTIVE' ? 'CLOSED' : 'ACTIVE' } : e)))
    setToggleId(null)
    toast.success(exam?.status === 'ACTIVE' ? 'Exam deactivated' : 'Exam activated', `${exam?.name} is now ${exam?.status === 'ACTIVE' ? 'closed' : 'active'}.`)
  }

  const columns = [
    {
      key: 'name',
      header: 'Exam',
      render: (r) => (
        <div className="flex items-center" style={{ gap: 12 }}>
          <span className="stat-icon ic-primary" style={{ width: 38, height: 38 }}>
            <FileSpreadsheet size={18} />
          </span>
          <span className="cell-main">{r.name}</span>
        </div>
      ),
    },
    { key: 'semester', header: 'Semester', render: (r) => <Badge variant="primary">S{r.semester}</Badge> },
    { key: 'academicYear', header: 'Academic Year', render: (r) => <span className="muted">{r.academicYear}</span> },
    { key: 'startDate', header: 'Start', render: (r) => <span className="muted">{formatDate(r.startDate)}</span> },
    { key: 'endDate', header: 'End', render: (r) => <span className="muted">{formatDate(r.endDate)}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      header: '',
      style: { textAlign: 'right' },
      render: (row) => (
        <div className="flex" style={{ gap: 6, justifyContent: 'flex-end' }}>
          <button className="icon-btn" onClick={() => openView(row)} aria-label="View"><Eye size={16} /></button>
          <button className="icon-btn" onClick={() => openEdit(row)} aria-label="Edit"><Pencil size={16} /></button>
          <button className="icon-btn" onClick={() => setToggleId(row.id)} aria-label="Toggle status" title={row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}>
            <Power size={16} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Exams"
        subtitle={`Manage examination schedules ${total ? `(${total} total)` : ''}`}
        actions={<Button onClick={openAdd}><Plus size={18} /> Create Exam</Button>}
      />
      <Card>
        <div className="card-body" style={{ paddingBottom: 8 }}>
          <div className="toolbar" style={{ marginBottom: 0 }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Search exams…" />
            <Filter
              value={status}
              onChange={(v) => { setStatus(v); setPage(1) }}
              options={[
                { value: 'UPCOMING', label: 'Upcoming' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'CLOSED', label: 'Closed' },
              ]}
            />
          </div>
        </div>
        <div className="card-body" style={{ paddingTop: 8 }}>
          <Table
            columns={columns}
            data={paged}
            loading={loading}
            empty={<EmptyState icon={FileSpreadsheet} title="No exams" description="Create your first examination." action={<Button onClick={openAdd}><Plus size={16} /> Create Exam</Button>} />}
          />
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Exam' : 'Create Exam'}>
        <Input label="Exam Name" value={form.name} required onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} placeholder="e.g. End Semester Examination - Sem 3" />
        <div className="grid grid-2">
          <Select label="Semester" value={form.semester} onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })}>
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </Select>
          <Select label="Academic Year" value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })}>
            {['2024-2025', '2025-2026', '2026-2027'].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
        </div>
        <div className="grid grid-2">
          <Input label="Start Date" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} error={errors.startDate} />
          <Input label="End Date" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} error={errors.endDate} />
        </div>
        <div className="flex justify-between" style={{ gap: 10 }}>
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>{editId ? 'Update Exam' : 'Create Exam'}</Button>
        </div>
      </Modal>

      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title="Exam Details">
        {selected && (
          <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div className="detail-row"><span className="k">Exam Name</span><span className="v">{selected.name}</span></div>
            <div className="detail-row"><span className="k">Semester</span><span className="v">Semester {selected.semester}</span></div>
            <div className="detail-row"><span className="k">Academic Year</span><span className="v">{selected.academicYear}</span></div>
            <div className="detail-row"><span className="k">Start Date</span><span className="v">{formatDate(selected.startDate)}</span></div>
            <div className="detail-row"><span className="k">End Date</span><span className="v">{formatDate(selected.endDate)}</span></div>
            <div className="detail-row"><span className="k">Status</span><span className="v"><StatusBadge status={selected.status} /></span></div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toggleId)}
        title={data.find((e) => e.id === toggleId)?.status === 'ACTIVE' ? 'Close this exam?' : 'Activate this exam?'}
        description="This will change the exam's operational status. Students and teachers will see the updated availability."
        confirmLabel={data.find((e) => e.id === toggleId)?.status === 'ACTIVE' ? 'Close Exam' : 'Activate'}
        variant={data.find((e) => e.id === toggleId)?.status === 'ACTIVE' ? 'danger' : 'primary'}
        onCancel={() => setToggleId(null)}
        onConfirm={handleToggle}
      />
    </div>
  )
}
