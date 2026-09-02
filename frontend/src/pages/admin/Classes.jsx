import { useEffect, useMemo, useState } from 'react'
import { Plus, School, Pencil, Ban } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { getClasses } from '../../services/mock'
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
const emptyForm = { name: '', department: '', year: '', division: '', academicYear: '2025-2026' }

export default function Classes() {
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
    const res = await getClasses()
    setData(res.data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    let list = data
    const q = search.trim().toLowerCase()
    if (q) list = list.filter((c) => c.name.toLowerCase().includes(q) || c.department.toLowerCase().includes(q))
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
    setForm({ name: row.name, department: row.department, year: row.year, division: row.division, academicYear: row.academicYear })
    setErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Name is required.'
    if (!form.department) next.department = 'Department is required.'
    if (!form.year) next.year = 'Year is required.'
    if (!form.division) next.division = 'Division is required.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    setSaving(true)
    setTimeout(() => {
      if (editId) {
        setData((prev) => prev.map((c) => (c.id === editId ? { ...c, ...form } : c)))
        toast.success('Class updated', `${form.name} was updated.`)
      } else {
        setData((prev) => [...prev, { id: Date.now(), ...form, status: 'ACTIVE' }])
        toast.success('Class added', `${form.name} was added.`)
      }
      setSaving(false)
      setModalOpen(false)
    }, 600)
  }

  const handleDelete = () => {
    setDeleteId(null)
    setData((prev) => prev.filter((c) => c.id !== deleteId))
    toast.success('Class deactivated', 'The class was deactivated.')
  }

  const columns = [
    {
      key: 'name',
      header: 'Class',
      render: (r) => (
        <div className="flex items-center" style={{ gap: 12 }}>
          <span className="stat-icon ic-accent" style={{ width: 38, height: 38 }}>
            <School size={18} />
          </span>
          <span className="cell-main">{r.name}</span>
        </div>
      ),
    },
    { key: 'department', header: 'Department' },
    { key: 'year', header: 'Year', render: (r) => <Badge variant="primary">{r.year}</Badge> },
    { key: 'division', header: 'Division', render: (r) => <Badge variant="secondary">{r.division}</Badge> },
    { key: 'academicYear', header: 'Academic Year', render: (r) => <span className="muted">{r.academicYear}</span> },
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
        title="Classes"
        subtitle={`Manage class groups ${total ? `(${total} total)` : ''}`}
        actions={<Button onClick={openAdd}><Plus size={18} /> Add Class</Button>}
      />
      <Card>
        <div className="card-body" style={{ paddingBottom: 8 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search classes…" />
        </div>
        <div className="card-body" style={{ paddingTop: 8 }}>
          <Table
            columns={columns}
            data={paged}
            loading={loading}
            empty={<EmptyState icon={School} title="No classes" description="Add your first class group." action={<Button onClick={openAdd}><Plus size={16} /> Add Class</Button>} />}
          />
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Class' : 'Add Class'}>
        <Input label="Class Name" value={form.name} required onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} placeholder="e.g. SE-I B" />
        <Select label="Department" value={form.department} required onChange={(e) => setForm({ ...form, department: e.target.value })} error={errors.department}>
          <option value="">Select department</option>
          {['Computer Science', 'Electronics & Telecom', 'Mechanical Engineering', 'Civil Engineering'].map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </Select>
        <div className="grid grid-2">
          <Select label="Year" value={form.year} required onChange={(e) => setForm({ ...form, year: e.target.value })} error={errors.year}>
            <option value="">Year</option>
            {['FE', 'SE', 'TE', 'BE'].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
          <Select label="Division" value={form.division} required onChange={(e) => setForm({ ...form, division: e.target.value })} error={errors.division}>
            <option value="">Division</option>
            {['A', 'B', 'C'].map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>
        </div>
        <Select label="Academic Year" value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })}>
          {['2024-2025', '2025-2026', '2026-2027'].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </Select>
        <div className="flex justify-between" style={{ gap: 10 }}>
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>{editId ? 'Update' : 'Add'}</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Deactivate class?"
        description="This class will be deactivated. Existing enrollments remain intact."
        confirmLabel="Deactivate"
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
