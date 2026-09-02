import { ShieldX, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Forbidden() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const goHome = () => {
    const home = user?.role === 'admin' ? '/admin/dashboard' : user?.role === 'teacher' ? '/teacher/dashboard' : '/login'
    navigate(home)
  }

  return (
    <div className="error-page">
      <div className="error-card">
        <div className="state-icon error" style={{ margin: '0 auto 16px', width: 72, height: 72 }}>
          <ShieldX size={34} />
        </div>
        <div className="error-code">403</div>
        <h1 className="error-title">Access denied</h1>
        <p className="error-desc">You don't have permission to view this page. Your account role doesn't match the required access level.</p>
        <button className="btn btn-primary" onClick={goHome}>
          <ArrowLeft size={16} /> Back to dashboard
        </button>
      </div>
    </div>
  )
}