import { Link } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function NotFound() {
  const { role } = useAuth()
  const home = role ? `/${role.toLowerCase()}/dashboard` : '/login'

  return (
    <div className="state-block" style={{ minHeight: '70vh' }}>
      <div className="state-icon">
        <SearchX size={30} />
      </div>
      <div className="state-title">404 — Page not found</div>
      <div className="state-desc">
        The page you're looking for doesn't exist or may have been moved.
      </div>
      <Link to={home} className="btn btn-primary">
        Back to Dashboard
      </Link>
    </div>
  )
}