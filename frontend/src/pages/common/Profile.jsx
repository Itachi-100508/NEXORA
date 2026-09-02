import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import Card from '../../components/ui/Card'
import PageHeader from '../../components/ui/PageHeader'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

export default function Profile() {
  const { user, updateUser, role } = useAuth()
  const { toast } = useToast()
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' })
  const [saving, setSaving] = useState(false)

  const details = {
    'Role': user?.roleLabel || role,
    'Email': user?.email,
    'Department': user?.department || '—',
  }
  if (user?.employeeId) details['Employee ID'] = user.employeeId
  if (user?.rollNumber) details['Roll Number'] = user.rollNumber
  if (user?.className) details['Class'] = user.className
  if (user?.semester) details['Semester'] = `Semester ${user.semester}`

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      updateUser({ name: form.name })
      setSaving(false)
      toast.success('Profile updated', 'Your profile information was saved.')
    }, 600)
  }

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Manage your personal information." />
      <div className="profile-grid">
        <Card padded className="profile-side">
          <div className="avatar-wrap">
            <Avatar name={user?.name} size="lg" />
          </div>
          <h3 style={{ marginBottom: 4 }}>{user?.name}</h3>
          <span className="muted" style={{ fontSize: 13 }}>{user?.email}</span>
          <div style={{ marginTop: 14 }}>
            <span className="badge badge-primary">{user?.roleLabel || role}</span>
          </div>
        </Card>

        <Card>
          <div className="card-header">
            <h3>Account Information</h3>
          </div>
          <div className="card-body">
            {Object.entries(details).map(([k, v]) => (
              <div className="detail-row" key={k}>
                <span className="k">{k}</span>
                <span className="v">{v || '—'}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card style={{ marginTop: 20 }}>
        <div className="card-header">
          <h3>Edit Personal Details</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-2">
            <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={!form.name.trim() ? 'Name is required.' : undefined} />
            <Input label="Email" value={form.email} disabled hint="Email cannot be changed from here." />
          </div>
          <div className="flex justify-between" style={{ gap: 10 }}>
            <Button variant="ghost" onClick={() => setForm({ name: user?.name || '', email: user?.email || '' })}>Reset</Button>
            <Button onClick={handleSave} loading={saving} disabled={!form.name.trim()}>Save Changes</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}