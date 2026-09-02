import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GraduationCap, Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { getUserFriendlyMessage } from '../../services/api'
import { ROLES } from '../../constants'
import AuthLayout from '../../layouts/AuthLayout'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

const ROLE_BASE = {
  [ROLES.ADMIN]: '/admin/dashboard',
  [ROLES.TEACHER]: '/teacher/dashboard',
  [ROLES.STUDENT]: '/student/dashboard',
}

export default function Login() {
  const { login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const next = {}
    if (!email.trim()) next.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email address.'
    if (!password) next.password = 'Password is required.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const { user, isMock } = await login(email, password)
      if (isMock) {
        toast.info('Demo mode active', 'Backend not detected — using sample authentication.')
      }
      toast.success('Welcome back!', `Signed in as ${user.name}.`)
      const base = ROLE_BASE[user.role]
      navigate(base || '/login', { replace: true })
    } catch (error) {
      toast.error('Sign in failed', getUserFriendlyMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (type) => {
    const demo = {
      admin: { email: 'admin@examora.edu', password: 'password' },
      teacher: { email: 'teacher@examora.edu', password: 'password' },
      student: { email: 'student@examora.edu', password: 'password' },
    }[type]
    if (demo) {
      setEmail(demo.email)
      setPassword(demo.password)
    }
  }

  return (
    <AuthLayout>
      <div className="auth-mobile-brand">
        <div className="auth-mobile-logo">
          <GraduationCap size={26} />
        </div>
        <div className="auth-mobile-name">EXAMORA</div>
      </div>

      <div className="auth-card">
        <h2 className="auth-form-title">Welcome back</h2>
        <p className="auth-form-sub">Sign in to access your academic dashboard.</p>

        <form onSubmit={handleSubmit} noValidate>
          <Input
            label="Email address"
            type="email"
            placeholder="you@examora.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            required
            icon={Mail}
            autoComplete="email"
          />
          <div className="form-group">
            <div className="flex justify-between items-center">
              <label className="form-label">
                Password<span className="req">*</span>
              </label>
              <Link to="/forgot-password" className="muted" style={{ fontSize: 12.5 }}>
                Forgot password?
              </Link>
            </div>
            <div className="input-icon-wrap">
              <span className="input-icon">
                <Lock size={17} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                className={`form-control ${errors.password ? 'has-error' : ''}`}
                style={{ paddingRight: 44 }}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <div className="flex items-center justify-between mb-4">
            <label className="flex items-center gap-2" style={{ cursor: 'pointer', fontSize: 13.5 }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                style={{ accentColor: 'var(--primary)', width: 16, height: 16 }}
              />
              <span className="muted">Remember me</span>
            </label>
          </div>

          <Button type="submit" variant="primary" block loading={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <div className="demo-divider">
          <span>Demo accounts</span>
        </div>

        <div className="demo-accounts">
          <button className="demo-chip" onClick={() => fillDemo('admin')}>Admin</button>
          <button className="demo-chip" onClick={() => fillDemo('teacher')}>Teacher</button>
          <button className="demo-chip" onClick={() => fillDemo('student')}>Student</button>
        </div>
        <p className="demo-hint">Demo mode: no backend detected. Use these quick access buttons or password “password”.</p>
      </div>
    </AuthLayout>
  )
}
