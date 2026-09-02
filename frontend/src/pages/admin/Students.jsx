import { useCallback, useEffect, useRef, useState } from 'react'
import { Plus, GraduationCap, Pencil, Eye, UserX, Check, Trash2 } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { studentService } from '../../services/studentService'
import { academicService } from '../../services/academicService'
import api, { getUserFriendlyMessage } from '../../services/api'
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

const PAGE_SIZE = 10

const emptyForm = {
  name: '',
  rollNumber: '',
  enrollmentNumber: '',
  email: '',
  departmentId: '',
  classroomId: '',
  sectionId: '',
  admissionYear: '',
}

export default function Students() {
  const { toast } = useToast()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [actionId, setActionId] = useState(null)
  const [actionType, setActionType] = useState(null) // 'activate', 'deactivate', or 'delete'
  const pendingDeleteIdRef = useRef(null)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState(null)

  // Dropdown data
  const [departments, setDepartments] = useState([])
  const [classrooms, setClassrooms] = useState([])
  const [sections, setSections] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [loadingDropdowns, setLoadingDropdowns] = useState(false)

  const loadDropdowns = useCallback(async () => {
    try {
      const [deptRes, yearRes] = await Promise.all([
        academicService.getDepartments(),
        academicService.getAcademicYears(),
      ])
      setDepartments(deptRes || [])
      setAcademicYears(yearRes || [])
      // Initially load all classrooms and sections
      const [classRes, secRes] = await Promise.all([
        academicService.getClassrooms(),
        academicService.getSections(),
      ])
      setClassrooms(classRes || [])
      setSections(secRes || [])
    } catch (err) {
      console.error('Error loading dropdowns:', err)
    }
  }, [])

  const loadClassroomsByDepartment = useCallback(async (departmentId) => {
    if (!departmentId) {
      setClassrooms([])
      setSections([])
      return
    }
    try {
      setLoadingDropdowns(true)
      const classRes = await academicService.getClassroomsByDepartment(departmentId)
      setClassrooms(classRes || [])
      setSections([]) // Reset sections when department changes
    } catch (err) {
      console.error('Error loading classrooms:', err)
      setClassrooms([])
    } finally {
      setLoadingDropdowns(false)
    }
  }, [])

  const loadSectionsByClassroom = useCallback(async (classroomId) => {
    if (!classroomId) {
      setSections([])
      return
    }
    try {
      setLoadingDropdowns(true)
      const secRes = await academicService.getSectionsByClassroom(classroomId)
      setSections(secRes || [])
    } catch (err) {
      console.error('Error loading sections:', err)
      setSections([])
    } finally {
      setLoadingDropdowns(false)
    }
  }, [])

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const res = await studentService.getAll({ page, search })
      setData(res.results || res || [])
      setTotal(res.count || 0)
    } catch (err) {
      console.error('Error loading students:', err)
      setError(getUserFriendlyMessage(err))
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  useEffect(() => {
    loadDropdowns()
  }, [loadDropdowns])

  const paged = data

  const openAdd = () => {
    setEditId(null)
    setForm(emptyForm)
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = async (row) => {
    try {
      // Fetch full student details to get all IDs
      const details = await studentService.getById(row.id)
      setEditId(row.id)

      // If student has a department, load classrooms for that department
      if (details.department_id) {
        await loadClassroomsByDepartment(details.department_id)
      }

      // If student has a classroom, load sections for that classroom
      if (details.class_id) {
        await loadSectionsByClassroom(details.class_id)
      }

      setForm({
        name: `${details.first_name || ''} ${details.last_name || ''}`.trim(),
        rollNumber: details.roll_number || '',
        enrollmentNumber: details.enrollment_number || '',
        email: details.email || '',
        departmentId: details.department_id || '',
        classroomId: details.class_id || '',
        sectionId: details.section_id || '',
        admissionYear: details.admission_year || '',
      })
      setErrors({})
      setModalOpen(true)
    } catch (err) {
      const msg = getUserFriendlyMessage(err)
      toast.error('Error', msg)
    }
  }

  const openView = (row) => {
    setSelected(row)
    setViewOpen(true)
  }

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Name is required.'
    if (!form.rollNumber.trim()) next.rollNumber = 'Roll number is required.'
    if (!form.enrollmentNumber.trim()) next.enrollmentNumber = 'Enrollment number is required.'
    if (!form.email.trim()) next.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const nameParts = form.name.trim().split(/\s+/)
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      if (editId) {
        // Update existing student
        const payload = {
          first_name: firstName,
          last_name: lastName,
          email: form.email,
          roll_number: form.rollNumber,
          enrollment_number: form.enrollmentNumber,
          classroom_id: form.classroomId || null,
          section_id: form.sectionId || null,
          admission_year: form.admissionYear || null,
        }
        await studentService.update(editId, payload)
        // Reload data to get updated info from backend
        await load()
        toast.success('Student updated', `${form.name} was updated successfully.`)
      } else {
        // Create new student - need username and password
        const payload = {
          username: form.email.split('@')[0],
          email: form.email,
          password: 'Password123!', // Demo password
          first_name: firstName,
          last_name: lastName,
          enrollment_number: form.enrollmentNumber,
          roll_number: form.rollNumber,
          classroom_id: form.classroomId || null,
          section_id: form.sectionId || null,
          admission_year: form.admissionYear || null,
        }
        await studentService.create(payload)
        // Reload data to see new student
        setPage(1)
        await load()
        toast.success('Student added', `${form.name} was added successfully.`)
      }
      setModalOpen(false)
    } catch (err) {
      const msg = getUserFriendlyMessage(err)
      toast.error('Error', msg)
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async () => {
    const id = actionId
    const type = actionType
    setActionId(null)
    setActionType(null)
    try {
      if (type === 'activate') {
        await studentService.activate(id)
        await load()
        toast.success('Student activated', 'The student is now active and can log in.')
      } else if (type === 'deactivate') {
        await studentService.deactivate(id)
        await load()
        toast.success('Student deactivated', 'The student record was deactivated.')
      }
    } catch (err) {
      const msg = getUserFriendlyMessage(err)
      toast.error('Error', msg)
    }
  }

  const handleDelete = async () => {
    const id = pendingDeleteIdRef.current
    pendingDeleteIdRef.current = null
    setActionId(null)
    setActionType(null)
    try {
      await studentService.permanentDelete(id)
      await load()
      toast.success('Student deleted', 'The student has been permanently deleted.')
    } catch (err) {
      const msg = getUserFriendlyMessage(err)
      toast.error('Error', msg)
    }
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
    { key: 'roll_number', header: 'Roll No.', render: (r) => <span className="muted">{r.roll_number}</span> },
    { key: 'class', header: 'Class', render: (r) => r.class || '—' },
    { key: 'section', header: 'Section', render: (r) => r.section || '—' },
    { key: 'department', header: 'Department', render: (r) => r.department || '—' },
    { key: 'semester', header: 'Semester', render: (r) => r.semester ? <Badge variant="secondary">{r.semester}</Badge> : '—' },
    { key: 'admission_year', header: 'Year', render: (r) => r.admission_year || '—' },
    { key: 'is_active', header: 'Status', render: (r) => <StatusBadge status={r.is_active ? 'ACTIVE' : 'INACTIVE'} /> },
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
          {row.is_active ? (
            <button
              className="icon-btn"
              onClick={() => { setActionId(row.id); setActionType('deactivate'); }}
              aria-label="Deactivate"
              title="Deactivate"
            >
              <UserX size={16} />
            </button>
          ) : (
            <button
              className="icon-btn"
              onClick={() => { setActionId(row.id); setActionType('activate'); }}
              aria-label="Activate"
              title="Activate"
              style={{ color: 'var(--success)' }}
            >
              <Check size={16} />
            </button>
          )}
          <button
            className="icon-btn"
            onClick={() => { pendingDeleteIdRef.current = row.id; setActionId(row.id); setActionType('delete'); }}
            aria-label="Delete permanently"
            title="Delete permanently"
            style={{ color: 'var(--danger)' }}
          >
            <Trash2 size={16} />
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
          <Input
            label="Full Name"
            value={form.name}
            required
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            required
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={errors.email}
          />
          <Input
            label="Roll Number"
            value={form.rollNumber}
            required
            onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
            error={errors.rollNumber}
          />
          <Input
            label="Enrollment Number"
            value={form.enrollmentNumber}
            required
            onChange={(e) => setForm({ ...form, enrollmentNumber: e.target.value })}
            error={errors.enrollmentNumber}
          />
          <Select
            label="Department"
            value={form.departmentId}
            onChange={(e) => {
              const deptId = e.target.value
              setForm({ ...form, departmentId: deptId, classroomId: '', sectionId: '' })
              if (deptId) {
                loadClassroomsByDepartment(deptId)
              } else {
                setClassrooms([])
                setSections([])
              }
            }}
          >
            <option value="">Select department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </Select>
          <Select
            label="Class"
            value={form.classroomId}
            onChange={(e) => {
              const classId = e.target.value
              setForm({ ...form, classroomId: classId, sectionId: '' })
              if (classId) {
                loadSectionsByClassroom(classId)
              } else {
                setSections([])
              }
            }}
            disabled={!form.departmentId}
          >
            <option value="">Select class</option>
            {classrooms.length === 0 && form.departmentId && !loadingDropdowns && (
              <option value="" disabled>No classes available for this department</option>
            )}
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </Select>
          <Select
            label="Section"
            value={form.sectionId}
            onChange={(e) => setForm({ ...form, sectionId: e.target.value })}
            disabled={!form.classroomId}
          >
            <option value="">Select section</option>
            {sections.length === 0 && form.classroomId && !loadingDropdowns && (
              <option value="" disabled>No sections available for this class</option>
            )}
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          <Select
            label="Admission Year"
            value={form.admissionYear}
            onChange={(e) => setForm({ ...form, admissionYear: e.target.value })}
          >
            <option value="">Select admission year</option>
            {[2022, 2023, 2024, 2025, 2026, 2027].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </Select>
        </div>
        {!editId && (
          <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>
            Note: Default password will be set to "Password123!" for new students.
          </div>
        )}
        <div className="flex justify-between" style={{ gap: 10, marginTop: 16 }}>
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
                <div className="muted">{selected.roll_number}</div>
              </div>
            </div>
            <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div className="detail-row"><span className="k">Enrollment No.</span><span className="v">{selected.enrollment_number || '—'}</span></div>
              <div className="detail-row"><span className="k">Email</span><span className="v">{selected.email}</span></div>
              <div className="detail-row"><span className="k">Username</span><span className="v">{selected.username || '—'}</span></div>
              <div className="detail-row"><span className="k">Department</span><span className="v">{selected.department || '—'}</span></div>
              <div className="detail-row"><span className="k">Class</span><span className="v">{selected.class || '—'}</span></div>
              <div className="detail-row"><span className="k">Section</span><span className="v">{selected.section || '—'}</span></div>
              <div className="detail-row"><span className="k">Semester</span><span className="v">{selected.semester ? `Semester ${selected.semester}` : '—'}</span></div>
              <div className="detail-row"><span className="k">Admission Year</span><span className="v">{selected.admission_year || '—'}</span></div>
              <div className="detail-row"><span className="k">Status</span><span className="v"><StatusBadge status={selected.is_active ? 'ACTIVE' : 'INACTIVE'} /></span></div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(actionId)}
        title={actionType === 'activate' ? 'Activate student?' : actionType === 'deactivate' ? 'Deactivate student?' : 'Delete student permanently?'}
        description={
          actionType === 'activate'
            ? 'This student will be activated and will be able to log in to their account.'
            : actionType === 'deactivate'
              ? 'This student record will be deactivated and will no longer appear in active lists. You can reactivate later.'
              : 'This will permanently delete this student and cannot be undone. All associated data will be removed.'
        }
        confirmLabel={actionType === 'activate' ? 'Activate' : actionType === 'deactivate' ? 'Deactivate' : 'Delete permanently'}
        onCancel={() => { pendingDeleteIdRef.current = null; setActionId(null); setActionType(null); }}
        onConfirm={actionType === 'delete' ? handleDelete : handleStatusChange}
      />
    </div>
  )
}
