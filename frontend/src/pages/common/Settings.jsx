import { useState } from 'react'
import { Check, Palette } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { useTheme } from '../../context/ThemeContext'
import Card from '../../components/ui/Card'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { cn } from '../../utils/helpers'

const swatchThemes = {
  light: 'linear-gradient(135deg, #FFFFFF, #E6EAF0)',
  soft: 'linear-gradient(135deg, #FBF7F2, #E5D9C8)',
  cool: 'linear-gradient(135deg, #EEF3F9, #CFDCEB)',
  dark: 'linear-gradient(135deg, #0F172A, #1E293B)',
}

export default function Settings() {
  const { toast } = useToast()
  const { theme, accent, setTheme, setAccent, themes, accents } = useTheme()
  const [notifPrefs, setNotifPrefs] = useState({ email: true, push: true, marks: true, results: false })
  const [security, setSecurity] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const togglePref = (key) => setNotifPrefs((prev) => ({ ...prev, [key]: !prev[key] }))

  const savePrefs = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      toast.success('Preferences saved', 'Your notification preferences were updated.')
    }, 600)
  }

  const handlePassword = () => {
    const next = {}
    if (!security.currentPassword) next.currentPassword = 'Current password is required.'
    if (security.newPassword.length < 6) next.newPassword = 'New password must be at least 6 characters.'
    if (security.confirm !== security.newPassword) next.confirm = 'Passwords do not match.'
    setErrors(next)
    if (Object.keys(next).length) return
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setSecurity({ currentPassword: '', newPassword: '', confirm: '' })
      toast.success('Password changed', 'Your password was updated successfully.')
    }, 700)
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your preferences, appearance and security." />

      <Card style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h3 className="flex items-center gap-2">
            <Palette size={18} /> Appearance & Theme
          </h3>
        </div>
        <div className="card-body">
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13.5 }}>Interface Theme</div>
            <div className="grid grid-4" style={{ gap: 12 }}>
              {themes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={cn('theme-option', theme === t.value && 'active')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                  }}
                  onClick={() => {
                    setTheme(t.value)
                    toast.success('Theme updated', `Switched to ${t.label} theme.`)
                  }}
                >
                  <span className="theme-swatch" style={{ background: swatchThemes[t.value], width: 22, height: 22, borderRadius: '50%', border: '1px solid var(--border)' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{t.label}</div>
                    <div className="muted" style={{ fontSize: 11.5 }}>{t.description}</div>
                  </div>
                  {theme === t.value && <Check size={16} style={{ marginLeft: 'auto', color: 'var(--primary)' }} />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13.5 }}>Accent Color</div>
            <div className="flex items-center" style={{ gap: 14 }}>
              {accents.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  className={cn('accent-swatch', accent === a.value && 'active')}
                  style={{
                    background: a.color,
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    border: accent === a.value ? '3px solid var(--text)' : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease',
                  }}
                  onClick={() => {
                    setAccent(a.value)
                    toast.success('Accent updated', `Active accent is now ${a.label}.`)
                  }}
                  title={a.label}
                  aria-label={`Set accent to ${a.label}`}
                >
                  {accent === a.value && <Check size={16} strokeWidth={3} />}
                </button>
              ))}
              <span className="muted" style={{ fontSize: 13, marginLeft: 8 }}>
                Affects buttons, active tabs, links and chart highlights.
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-2-equal" style={{ marginBottom: 20 }}>
        <Card>
          <div className="card-header">
            <h3>Notification Preferences</h3>
          </div>
          <div className="card-body">
            {[
              { key: 'email', label: 'Email notifications', desc: 'Receive updates via email' },
              { key: 'push', label: 'Push notifications', desc: 'In-app and browser notifications' },
              { key: 'marks', label: 'Marks related updates', desc: 'Assignment and submission alerts' },
              { key: 'results', label: 'Result announcements', desc: 'When results are published' },
            ].map((pref) => (
              <div className="detail-row" key={pref.key}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{pref.label}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{pref.desc}</div>
                </div>
                <label className="switch-wrap">
                  <input type="checkbox" checked={notifPrefs[pref.key]} onChange={() => togglePref(pref.key)} />
                  <span className="switch" />
                </label>
              </div>
            ))}
            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={savePrefs} loading={saving}>Save Preferences</Button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="card-header">
            <h3>Change Password</h3>
          </div>
          <div className="card-body">
            <Input label="Current Password" type="password" value={security.currentPassword} onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })} error={errors.currentPassword} />
            <Input label="New Password" type="password" value={security.newPassword} onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })} error={errors.newPassword} />
            <Input label="Confirm New Password" type="password" value={security.confirm} onChange={(e) => setSecurity({ ...security, confirm: e.target.value })} error={errors.confirm} />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={handlePassword} loading={saving}>Update Password</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}