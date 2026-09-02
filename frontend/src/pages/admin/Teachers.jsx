import { useEffect, useMemo, useState } from 'react'
import { Plus, Users, Pencil, UserX } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { getTeachers } from '../../services/mock'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import SearchBar from '../../components/ui/SearchBar'
import Pagination from '../../components/ui/Pagination'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import Avatar from '../../components/ui/Avatar'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'

const PAGE_SIZE = 8

const emptyForm = {
  name: '',
  employeeId: '',
  email: '',
  department: '',
}

export default function Teachers() {
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
    const res = await getTeachers()
    setData(res.data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [search])

  const filtered = useMemo(() => {
    let list = data
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (t) => t.name.toLowerCase().includes(q) || t.employeeId.toLowerCase().includes(q) || t.email.toLowerCase().includes(q),
      )
    }
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
    setForm({ ...emptyForm, ...row })
    setErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Name is required.'
    if (!form.employeeId.trim()) next.employeeId = 'Employee ID is required.'
    if (!form.email.trim()) next.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email.'
    if (!form.department) next.department = 'Department is required.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    setSaving(true)
    setTimeout(() => {
      if (editId) {
        setData((prev) => prev.map((t) => (t.id === editId ? { ...t, ...form } : t)))
        toast.success('Teacher updated', `${form.name} was updated successfully.`)
      } else {
        setData((prev) => [...prev, { id: Date.now(), ...form, status: 'ACTIVE' }])
        toast.success('Teacher added', `${form.name} was added successfully.`)
      }
      setSaving(false)
      setModalOpen(false)
    }, 600)
  }

  const handleDelete = () => {
    setDeleteId(null)
    setData((prev) => prev.filter((t) => t.id !== deleteId))
    toast.success('Teacher removed', 'The teacher record was deactivated.')
  }

  const columns = [
    {
      key: 'name',
      header: 'Teacher',
      render: (row) => (
        <div className="flex items-center" style={{ gap: 12 }}>
          <Avatar name={row.name} size="sm" />
          <div>
            <div className="cell-main">{row.name}</div>
            <div className="cell-sub">{row.email}</div>
          </div>
        </div>
      ),
    },
    { key: 'employeeId', header: 'Employee ID', render: (r) => <span className="muted">{r.employeeId}</span> },
    { key: 'department', header: 'Department' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      header: '',
      style: { textAlign: 'right' },
      render: (row) => (
        <div className="flex" style={{ gap: 6, justifyContent: 'flex-end' }}>
          <button className="icon-btn" onClick={() => openEdit(row)} aria-label="Edit" title="Edit">
            <Pencil size={16} />
          </button>
          <button className="icon-btn" onClick={() => setDeleteId(row.id)} aria-label="Deactivate" title="Deactivate">
            <UserX size={16} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Teachers"
        subtitle={`Manage faculty records ${total ? `(${total} total)` : ''}`}
        actions={
          <Button onClick={openAdd}>
            <Plus size={18} /> Add Teacher
          </Button>
        }
      />

      <Card>
        <div className="card-body" style={{ paddingBottom: 8 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name, employee ID or email…" />
        </div>
        <div className="card-body" style={{ paddingTop: 8 }}>
          <Table
            columns={columns}
            data={paged}
            loading={loading}
            empty={
              <EmptyState
                icon={Users}
                title="No teachers found"
                description="No teacher records match your search."
                action={<Button onClick={openAdd}><Plus size={16} /> Add Teacher</Button>}
              />
            }
          />
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Teacher' : 'Add Teacher'}>
        <Input label="Full Name" value={form.name} required onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
        <Input label="Employee ID" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} error={errors.employeeId} />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />
        <Select label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required error={errors.department}>
          <option value="">Select department</option>
          {['Computer Science', 'Electronics & Telecom', 'Mechanical Engineering', 'Civil Engineering'].map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </Select>
        <div className="flex justify-between" style={{ gap: 10 }}>
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>{editId ? 'Update Teacher' : 'Add Teacher'}</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Deactivate teacher?"
        description="This teacher record will be deactivated. Existing assignments remain but no new work will be assigned."
        confirmLabel="Deactivate"
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
