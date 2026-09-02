import { useEffect, useMemo, useState } from 'react'
import { Plus, Building2, Pencil, Ban } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { getDepartments } from '../../services/mock'
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

const PAGE_SIZE = 8

const emptyForm = { name: '', code: '' }

export default function Departments() {
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
    const res = await getDepartments()
    setData(res.data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    let list = data
    const q = search.trim().toLowerCase()
    if (q) list = list.filter((d) => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q))
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
    setForm({ name: row.name, code: row.code })
    setErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Name is required.'
    if (!form.code.trim()) next.code = 'Code is required.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    setSaving(true)
    setTimeout(() => {
      if (editId) {
        setData((prev) => prev.map((d) => (d.id === editId ? { ...d, ...form } : d)))
        toast.success('Department updated', `${form.name} was updated.`)
      } else {
        setData((prev) => [...prev, { id: Date.now(), ...form, status: 'ACTIVE' }])
        toast.success('Department added', `${form.name} was added.`)
      }
      setSaving(false)
      setModalOpen(false)
    }, 600)
  }

  const handleDelete = () => {
    setDeleteId(null)
    setData((prev) => prev.filter((d) => d.id !== deleteId))
    toast.success('Department deactivated', 'The department was deactivated.')
  }

  const columns = [
    {
      key: 'name',
      header: 'Department',
      render: (r) => (
        <div className="flex items-center" style={{ gap: 12 }}>
          <span className="stat-icon ic-primary" style={{ width: 38, height: 38 }}>
            <Building2 size={18} />
          </span>
          <span className="cell-main">{r.name}</span>
        </div>
      ),
    },
    { key: 'code', header: 'Code', render: (r) => <Badge variant="secondary">{r.code}</Badge> },
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
        title="Departments"
        subtitle={`Manage academic departments ${total ? `(${total} total)` : ''}`}
        actions={<Button onClick={openAdd}><Plus size={18} /> Add Department</Button>}
      />
      <Card>
        <div className="card-body" style={{ paddingBottom: 8 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search departments…" />
        </div>
        <div className="card-body" style={{ paddingTop: 8 }}>
          <Table
            columns={columns}
            data={paged}
            loading={loading}
            empty={<EmptyState icon={Building2} title="No departments" description="Add your first academic department." action={<Button onClick={openAdd}><Plus size={16} /> Add Department</Button>} />}
          />
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Department' : 'Add Department'}>
        <Input label="Department Name" value={form.name} required onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
        <Input label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} error={errors.code} placeholder="e.g. CS" />
        <div className="flex justify-between" style={{ gap: 10 }}>
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>{editId ? 'Update' : 'Add'}</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Deactivate department?"
        description="This department will be deactivated. Existing students and teachers remain associated."
        confirmLabel="Deactivate"
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
