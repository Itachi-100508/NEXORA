import { Link, Outlet } from 'react-router-dom'
import { GraduationCap, ShieldCheck } from 'lucide-react'
import ThemeSwitcher from '../components/ui/ThemeSwitcher'

export default function PublicLayout() {
  return (
    <div className="public-layout min-h-screen flex flex-col">
      <nav className="public-nav">
        <div className="container flex items-center justify-between" style={{ paddingTop: 16, paddingBottom: 16 }}>
          <Link to="/" className="public-brand flex items-center gap-3">
            <div className="public-logo" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <GraduationCap size={24} />
              EXAMORA
            </div>
            <span className="muted">Digital Result Management</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/verify-result" className="btn btn-ghost btn-sm flex items-center gap-1">
              <ShieldCheck size={16} /> Verify Result
            </Link>
            <Link to="/login" className="btn btn-outline btn-sm">
              Sign in
            </Link>
            <ThemeSwitcher />
          </div>
        </div>
      </nav>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
