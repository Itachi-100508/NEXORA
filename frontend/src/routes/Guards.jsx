import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROLES } from '../constants'
import Loader from '../components/ui/Loader'

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <Loader />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

export function RoleRoute({ role }) {
  const { role: userRole, isAuthenticated, loading } = useAuth()

  if (loading) {
    return <Loader />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (userRole !== role) {
    return <Navigate to="/403" replace />
  }

  return <Outlet />
}