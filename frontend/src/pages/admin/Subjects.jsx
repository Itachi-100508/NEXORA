import { useEffect, useMemo, useState } from 'react'
import { Plus, BookOpen, Pencil, Ban } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { getSubjects } from '../../services/mock'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import SearchBar from '../../components/ui/SearchBar'
import Pagination from '../../components/ui/Pagination'
import StatusBadge from '../../components/ui/StatusBadge'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'

const PAGE_SIZE = 8
const emptyForm = { name: '', code: '', semester: 3, credits: 4, maxMarks: 100, passingMarks: 40 }

export default function Subjects() {
  const { toast } = useToast()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await getSubjects()
    setData(res.data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    let list = data
    const q = search.trim().toLowerCase()
    if (q) list = list.filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q))
    return list
  }, [data, search])

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
    setForm({ name: row.name, code: row.code, semester: row.semester, credits: row.credits, maxMarks: row.maxMarks, passingMarks: row.passingMarks })
    setErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Name is required.'
    if (!form.code.trim()) next.code = 'Subject code is required.'
    if (!form.maxMarks || form.maxMarks <= 0) next.maxMarks = 'Maximum marks must be positive.'
    if (form.passingMarks >= form.maxMarks) next.passingMarks = 'Passing marks must be less than maximum.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    setSaving(true)
    setTimeout(() => {
      if (editId) {
        setData((prev) => prev.map((s) => (s.id === editId ? { ...s, ...form } : s)))
        toast.success('Subject updated', `${form.name} was updated.`)
      } else {
        setData((prev) => [...prev, { id: Date.now(), ...form, status: 'ACTIVE' }])
        toast.success('Subject added', `${form.name} was added.`)
      }
      setSaving(false)
      setModalOpen(false)
    }, 600)
  }

  const handleDelete = () => {
    setDeleteId(null)
    setData((prev) => prev.filter((s) => s.id !== deleteId))
    toast.success('Subject deactivated', 'The subject was deactivated.')
  }

  const columns = [
    {
      key: 'name',
      header: 'Subject',
      render: (r) => (
        <div className="flex items-center" style={{ gap: 12 }}>
          <span className="stat-icon ic-secondary" style={{ width: 38, height: 38 }}>
            <BookOpen size={18} />
          </span>
          <span className="cell-main">{r.name}</span>
        </div>
      ),
    },
    { key: 'code', header: 'Code', render: (r) => <Badge variant="secondary">{r.code}</Badge> },
    { key: 'semester', header: 'Semester', render: (r) => <Badge variant="primary">S{r.semester}</Badge> },
    { key: 'credits', header: 'Credits', render: (r) => <span className="muted">{r.credits}</span> },
    {
      key: 'marks',
      header: 'Max / Pass',
      render: (r) => (
        <span className="muted">
          {r.maxMarks} / {r.passingMarks}
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      header: '',
      style: { textAlign: 'right' },
      render: (row) => (
        <div className="flex" style={{ gap: 6, justifyContent: 'flex-end' }}>
          <button className="icon-btn" onClick={() => openEdit(row)} aria-label="Edit"><Pencil size={16} /></button>
          <button className="icon-btn" onClick={() => setDeleteId(row.id)} aria-label="Deactivate"><Ban size={16} /></button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Subjects"
        subtitle={`Manage subjects ${total ? `(${total} total)` : ''}`}
        actions={<Button onClick={openAdd}><Plus size={18} /> Add Subject</Button>}
      />
      <Card>
        <div className="card-body" style={{ paddingBottom: 8 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search subjects…" />
        </div>
        <div className="card-body" style={{ paddingTop: 8 }}>
          <Table
            columns={columns}
            data={paged}
            loading={loading}
            empty={<EmptyState icon={BookOpen} title="No subjects" description="Add your first subject." action={<Button onClick={openAdd}><Plus size={16} /> Add Subject</Button>} />}
          />
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Subject' : 'Add Subject'}>
        <Input label="Subject Name" value={form.name} required onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
        <div className="grid grid-2">
          <Input label="Subject Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} error={errors.code} placeholder="e.g. CS301" />
          <Select label="Semester" value={form.semester} onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })}>
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </Select>
        </div>
        <div className="grid grid-3">
          <Input label="Credits" type="number" value={form.credits} onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })} />
          <Input label="Max Marks" type="number" value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: Number(e.target.value) })} error={errors.maxMarks} />
          <Input label="Passing Marks" type="number" value={form.passingMarks} onChange={(e) => setForm({ ...form, passingMarks: Number(e.target.value) })} error={errors.passingMarks} />
        </div>
        <div className="flex justify-between" style={{ gap: 10 }}>
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>{editId ? 'Update' : 'Add'}</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Deactivate subject?"
        description="This subject will be deactivated and removed from new assignments."
        confirmLabel="Deactivate"
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
