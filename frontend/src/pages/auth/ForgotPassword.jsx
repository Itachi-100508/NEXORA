import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, Send } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { getUserFriendlyMessage } from '../../services/api'
import AuthLayout from '../../layouts/AuthLayout'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

export default function ForgotPassword() {
  const { forgotPassword } = useAuth()
  const { toast } = useToast()

  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const message = await forgotPassword(email)
      setSent(true)
      toast.success('Reset link sent', message)
    } catch (err) {
      toast.error('Unable to send', getUserFriendlyMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="auth-card">
        <Link to="/login" className="flex items-center gap-2 muted" style={{ fontSize: 13, marginBottom: 18 }}>
          <ArrowLeft size={15} /> Back to sign in
        </Link>

        {sent ? (
          <div className="text-center">
            <div className="state-icon" style={{ margin: '0 auto 18px', width: 72, height: 72 }}>
              <Send size={30} />
            </div>
            <h2 className="auth-form-title">Check your inbox</h2>
            <p className="auth-form-sub">
              If an account exists for <strong>{email}</strong>, a password reset link has been sent to it.
            </p>
            <Button variant="outline" block onClick={() => setSent(false)}>
              Send to different email
            </Button>
          </div>
        ) : (
          <>
            <h2 className="auth-form-title">Forgot password?</h2>
            <p className="auth-form-sub">
              Enter your registered email and we'll send you a link to reset your password.
            </p>
            <form onSubmit={handleSubmit} noValidate>
              <Input
                label="Email address"
                type="email"
                placeholder="you@examora.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={error}
                icon={Mail}
                required
                autoComplete="email"
              />
              <Button type="submit" variant="primary" block loading={loading}>
                {loading ? 'Sending…' : 'Send reset link'}
              </Button>
            </form>
          </>
        )}
      </div>
    </AuthLayout>
  )
}
