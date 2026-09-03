import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, GraduationCap, Pencil, Eye, UserX } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { getStudents } from '../../services/mock'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import SearchBar from '../../components/ui/SearchBar'
import Pagination from '../../components/ui/Pagination'
import StatusBadge from '../../components/ui/StatusBadge'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import Avatar from '../../components/ui/Avatar'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'

const PAGE_SIZE = 8

const emptyForm = {
  name: '',
  rollNumber: '',
  enrollmentNumber: '',
  email: '',
  department: '',
  className: '',
  academicYear: '2025-2026',
  semester: 3,
}

export default function Students() {
  const { toast } = useToast()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await getStudents({ search })
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
    if (q) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.rollNumber.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q),
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

  const openView = (row) => {
    setSelected(row)
    setViewOpen(true)
  }

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Name is required.'
    if (!form.rollNumber.trim()) next.rollNumber = 'Roll number is required.'
    if (!form.email.trim()) next.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email.'
    if (!form.department) next.department = 'Department is required.'
    if (!form.className) next.className = 'Class is required.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    setSaving(true)
    setTimeout(() => {
      if (editId) {
        setData((prev) => prev.map((s) => (s.id === editId ? { ...s, ...form } : s)))
        toast.success('Student updated', `${form.name} was updated successfully.`)
      } else {
        setData((prev) => [...prev, { id: Date.now(), ...form, status: 'ACTIVE' }])
        toast.success('Student added', `${form.name} was added successfully.`)
      }
      setSaving(false)
      setModalOpen(false)
    }, 600)
  }

  const handleDelete = () => {
    setDeleteId(null)
    setData((prev) => prev.filter((s) => s.id !== deleteId))
    toast.success('Student removed', 'The student record was deactivated.')
  }

  const columns = [
    {
      key: 'name',
      header: 'Student',
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
    { key: 'rollNumber', header: 'Roll No.', render: (r) => <span className="muted">{r.rollNumber}</span> },
    { key: 'className', header: 'Class' },
    { key: 'department', header: 'Department' },
    { key: 'semester', header: 'Semester', render: (r) => <Badge variant="secondary">{r.semester}</Badge> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      header: '',
      style: { textAlign: 'right' },
      render: (row) => (
        <div className="flex" style={{ gap: 6, justifyContent: 'flex-end' }}>
          <button className="icon-btn" onClick={() => openView(row)} aria-label="View" title="View">
            <Eye size={16} />
          </button>
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
        title="Students"
        subtitle={`Manage student records ${total ? `(${total} total)` : ''}`}
        actions={
          <Button onClick={openAdd}>
            <Plus size={18} /> Add Student
          </Button>
        }
      />

      <Card>
        <div className="card-body" style={{ paddingBottom: 8 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name, roll no or email…" />
        </div>

        <div className="card-body" style={{ paddingTop: 8 }}>
          <Table
            columns={columns}
            data={paged}
            loading={loading}
            empty={
              <EmptyState
                icon={GraduationCap}
                title="No students found"
                description="No student records match your search. Try a different query or add a new student."
                action={<Button onClick={openAdd}><Plus size={16} /> Add Student</Button>}
              />
            }
          />
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Student' : 'Add Student'} size="lg">
        <div className="grid grid-2">
          <Input label="Full Name" value={form.name} required onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
          <Input label="Roll Number" value={form.rollNumber} onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} error={errors.rollNumber} />
          <Input label="Enrollment Number" value={form.enrollmentNumber} onChange={(e) => setForm({ ...form, enrollmentNumber: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />
          <Select label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required error={errors.department}>
            <option value="">Select department</option>
            {['Computer Science', 'Electronics & Telecom', 'Mechanical Engineering', 'Civil Engineering'].map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>
          <Select label="Class" value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} required error={errors.className}>
            <option value="">Select class</option>
            {['SE-I B', 'TE-II A', 'BE-I C'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
          <Select label="Academic Year" value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })}>
            {['2024-2025', '2025-2026', '2026-2027'].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
          <Select label="Semester" value={form.semester} onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })}>
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </Select>
        </div>
        <div className="flex justify-between" style={{ gap: 10, marginTop: 8 }}>
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>{editId ? 'Update Student' : 'Add Student'}</Button>
        </div>
      </Modal>

      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title="Student Details">
        {selected && (
          <div>
            <div className="flex items-center" style={{ gap: 14, marginBottom: 18 }}>
              <Avatar name={selected.name} size="lg" />
              <div>
                <div style={{ fontWeight: 700, fontSize: 17 }}>{selected.name}</div>
                <div className="muted">{selected.rollNumber}</div>
              </div>
            </div>
            <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div className="detail-row"><span className="k">Enrollment No.</span><span className="v">{selected.enrollmentNumber || '—'}</span></div>
              <div className="detail-row"><span className="k">Email</span><span className="v">{selected.email}</span></div>
              <div className="detail-row"><span className="k">Department</span><span className="v">{selected.department}</span></div>
              <div className="detail-row"><span className="k">Class</span><span className="v">{selected.className}</span></div>
              <div className="detail-row"><span className="k">Academic Year</span><span className="v">{selected.academicYear}</span></div>
              <div className="detail-row"><span className="k">Semester</span><span className="v">Semester {selected.semester}</span></div>
              <div className="detail-row"><span className="k">Status</span><span className="v"><StatusBadge status={selected.status} /></span></div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Deactivate student?"
        description="This student record will be deactivated and will no longer appear in active lists. You can reactivate later."
        confirmLabel="Deactivate"
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
