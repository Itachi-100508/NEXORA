import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate, useLocation, Outlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  School,
  BookOpen,
  FileSpreadsheet,
  ClipboardList,
  Gauge,
  ShieldCheck,
  Trophy,
  BarChart3,
  PieChart,
  ScrollText,
  Bell,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
  UserCircle,
  ClipboardCheck,
  PenLine,
  Send,
  XCircle,
  FileText,
  History,
  QrCode,
  CalendarCheck,
  BellRing,
  ShieldAlert,
  CalendarRange,
  LayoutGrid,
  UserCheck,
  Focus,
  DoorOpen,
  FileCheck,
  LineChart,
  Timer,
  AlertTriangle,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { ROLES } from '../constants'
import { cn } from '../utils/helpers'
import Dropdown, { DropdownItem, DropdownSep } from '../components/ui/Dropdown'
import Avatar from '../components/ui/Avatar'
import ThemeSwitcher from '../components/ui/ThemeSwitcher'
import AIAssistant from '../components/ai/AIAssistant'

const NAV_ITEMS = {
  [ROLES.ADMIN]: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/exam-command-center', label: 'Exam Command Center', icon: Gauge },
    { to: '/admin/alerts', label: 'Smart Alerts', icon: BellRing },
    { to: '/admin/anomalies', label: 'Anomaly Detection', icon: ShieldAlert },
    { to: '/admin/exam-calendar', label: 'Exam Calendar', icon: CalendarRange },
    { to: '/admin/seating-arrangement', label: 'Seating Arrangement', icon: LayoutGrid },
    { to: '/admin/invigilators', label: 'Invigilators', icon: UserCheck },
    { to: '/admin/exam-day', label: 'Exam Day', icon: DoorOpen },
    { to: '/admin/incidents', label: 'Incidents', icon: AlertTriangle },
    { to: '/admin/result-integrity', label: 'Result Integrity', icon: FileCheck },
    { to: '/admin/teacher-workload', label: 'Teacher Workload', icon: Timer },
    { to: '/admin/students', label: 'Students', icon: GraduationCap },
    { to: '/admin/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/admin/teachers', label: 'Teachers', icon: Users },
    { to: '/admin/departments', label: 'Departments', icon: Building2 },
    { to: '/admin/classes', label: 'Classes', icon: School },
    { to: '/admin/subjects', label: 'Subjects', icon: BookOpen },
    { to: '/admin/exams', label: 'Exams', icon: FileSpreadsheet },
    { to: '/admin/marks', label: 'Marks Monitoring', icon: Gauge },
    { to: '/admin/results/verification', label: 'Result Verification', icon: ShieldCheck },
    { to: '/admin/assignments', label: 'Assignments', icon: ClipboardList },
    { to: '/admin/results', label: 'Results', icon: Trophy },
    { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
    { to: '/admin/analytics', label: 'Analytics', icon: PieChart },
    { to: '/admin/audit', label: 'Audit Logs', icon: ScrollText },
    { to: '/admin/notifications', label: 'Notifications', icon: Bell },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ],
  [ROLES.TEACHER]: [
    { to: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/teacher/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/teacher/assignments', label: 'My Assignments', icon: ClipboardList },
    { to: '/teacher/marks', label: 'Marks Entry', icon: PenLine },
    { to: '/teacher/submissions', label: 'Submissions', icon: Send },
    { to: '/teacher/rejected-marks', label: 'Rejected Marks', icon: XCircle },
    { to: '/teacher/invigilation', label: 'Invigilation', icon: Focus },
    { to: '/teacher/incidents', label: 'Incidents', icon: AlertTriangle },
    { to: '/teacher/workload', label: 'Workload', icon: Timer },
    { to: '/teacher/notifications', label: 'Notifications', icon: Bell },
  ],
  [ROLES.STUDENT]: [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/student/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/student/results', label: 'My Results', icon: FileText },
    { to: '/student/history', label: 'Result History', icon: History },
    { to: '/student/journey', label: 'Academic Journey', icon: LineChart },
    { to: '/student/marksheet', label: 'Marksheet', icon: ClipboardCheck },
    { to: '/student/qr', label: 'QR Verification', icon: QrCode },
    { to: '/student/notifications', label: 'Notifications', icon: Bell },
  ],
}

function SidebarContent({ role, collapsed, onNavigate }) {
  const items = NAV_ITEMS[role] || []

  return (
    <>
      <div className="sidebar-brand">
        <div className="brand-logo">
          <GraduationCap size={22} />
        </div>
        {!collapsed && (
          <div>
            <div className="brand-name">EXAMORA</div>
            <div className="brand-tag">Result Management</div>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => cn('sidebar-link', isActive && 'active')}
            title={collapsed ? item.label : undefined}
            onClick={onNavigate}
          >
            <span className="sidebar-ic">
              <item.icon size={19} />
            </span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </>
  )
}

export default function DashboardLayout() {
  const { user, role, logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const sidebarRef = useRef(null)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setCollapsed(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleLogout = async () => {
    await logout()
    toast.info('Signed out', 'You have been logged out successfully.')
    navigate('/login')
  }

  const roleLabel = user?.roleLabel

  return (
    <div className="dashboard-shell">
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      <aside
        ref={sidebarRef}
        className={cn(
          'sidebar',
          collapsed && 'sidebar-collapsed',
          sidebarOpen && 'sidebar-open',
        )}
      >
        <div className="sidebar-mobile-close">
          <button onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        <SidebarContent
          role={role}
          collapsed={collapsed}
          onNavigate={() => setSidebarOpen(false)}
        />
        {!collapsed && (
          <div className="sidebar-role">
            <span className="badge badge-primary">{roleLabel || role}</span>
          </div>
        )}
      </aside>

      <div className="dashboard-main">
        <header className="topbar">
          <div className="flex items-center gap-2">
            <button className="icon-btn toggle-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Menu size={20} />
            </button>
            <button className="icon-btn collapse-btn" onClick={() => setCollapsed((c) => !c)} aria-label="Collapse sidebar">
              <Menu size={20} />
            </button>
          </div>

          <div className="flex items-center" style={{ gap: 8 }}>
            <ThemeSwitcher />

            <NavLink to={`/${role.toLowerCase()}/notifications`} className="icon-btn" aria-label="Notifications">
              <Bell size={19} />
              <span className="notification-dot" />
            </NavLink>

            <Dropdown
              width={220}
              trigger={
                <div className="topbar-user">
                  <Avatar name={user?.name} size="sm" />
                  <div className="topbar-user-meta">
                    <div className="user-name">{user?.name || 'User'}</div>
                    <div className="user-role">{roleLabel || role}</div>
                  </div>
                  <ChevronDown size={15} className="muted" />
                </div>
              }
            >
              <DropdownItem icon={UserCircle} onClick={() => navigate(`/${role.toLowerCase()}/profile`)}>
                My Profile
              </DropdownItem>
              <DropdownItem icon={Settings} onClick={() => navigate(`/${role.toLowerCase()}/settings`)}>
                Settings
              </DropdownItem>
              <DropdownSep />
              <DropdownItem icon={LogOut} danger onClick={handleLogout}>
                Sign out
              </DropdownItem>
            </Dropdown>
          </div>
        </header>

        <main className="dashboard-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <AIAssistant />
    </div>
  )
}
