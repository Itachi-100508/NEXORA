import { Suspense, lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute, RoleRoute } from './Guards'
import { ROLES } from '../constants'
import Loader from '../components/ui/Loader'

import PublicLayout from '../layouts/PublicLayout'
import DashboardLayout from '../layouts/DashboardLayout'
import Login from '../pages/auth/Login'
import ForgotPassword from '../pages/auth/ForgotPassword'
import VerifyResult from '../pages/auth/VerifyResult'
import NotFound from '../pages/NotFound'
import Forbidden from '../pages/errors/Forbidden'

const withSuspense = (Component) => (props) => (
  <Suspense fallback={<Loader />}>
    <Component {...props} />
  </Suspense>
)

const AdminDashboard = withSuspense(lazy(() => import('../pages/admin/Dashboard')))
const AdminAttendance = withSuspense(lazy(() => import('../pages/admin/Attendance')))
const Students = withSuspense(lazy(() => import('../pages/admin/Students')))
const Teachers = withSuspense(lazy(() => import('../pages/admin/Teachers')))
const Departments = withSuspense(lazy(() => import('../pages/admin/Departments')))
const Classes = withSuspense(lazy(() => import('../pages/admin/Classes')))
const Subjects = withSuspense(lazy(() => import('../pages/admin/Subjects')))
const Exams = withSuspense(lazy(() => import('../pages/admin/Exams')))
const AdminMarks = withSuspense(lazy(() => import('../pages/admin/Marks')))
const AdminAssignments = withSuspense(lazy(() => import('../pages/admin/Assignments')))
const ResultVerification = withSuspense(lazy(() => import('../pages/admin/ResultVerification')))
const AdminResults = withSuspense(lazy(() => import('../pages/admin/Results')))
const AdminReports = withSuspense(lazy(() => import('../pages/admin/Reports')))
const AdminAnalytics = withSuspense(lazy(() => import('../pages/admin/Analytics')))
const AuditLogs = withSuspense(lazy(() => import('../pages/admin/AuditLogs')))
const AdminRevaluations = withSuspense(lazy(() => import('../pages/admin/Revaluations')))
const Import = withSuspense(lazy(() => import('../pages/admin/Import')))
const ExamCommandCenter = withSuspense(lazy(() => import('../pages/admin/ExamCommandCenter')))
const SmartAlerts = withSuspense(lazy(() => import('../pages/admin/SmartAlerts')))
const AcademicAnomalies = withSuspense(lazy(() => import('../pages/admin/AcademicAnomalies')))
const ExamCalendar = withSuspense(lazy(() => import('../pages/admin/ExamCalendar')))
const SeatingArrangement = withSuspense(lazy(() => import('../pages/admin/SeatingArrangement')))
const Invigilators = withSuspense(lazy(() => import('../pages/admin/Invigilators')))
const ExamDay = withSuspense(lazy(() => import('../pages/admin/ExamDay')))
const AdminIncidents = withSuspense(lazy(() => import('../pages/admin/Incidents')))
const ResultIntegrity = withSuspense(lazy(() => import('../pages/admin/ResultIntegrity')))
const AdminTeacherWorkload = withSuspense(lazy(() => import('../pages/admin/TeacherWorkload')))

const TeacherDashboard = withSuspense(lazy(() => import('../pages/teacher/Dashboard')))
const TeacherAttendance = withSuspense(lazy(() => import('../pages/teacher/Attendance')))
const TeacherAssignments = withSuspense(lazy(() => import('../pages/teacher/Assignments')))
const AssignmentDetail = withSuspense(lazy(() => import('../pages/teacher/AssignmentDetail')))
const MarksEntryHome = withSuspense(lazy(() => import('../pages/teacher/MarksEntryHome')))
const MarksEntry = withSuspense(lazy(() => import('../pages/teacher/MarksEntry')))
const TeacherSubmissions = withSuspense(lazy(() => import('../pages/teacher/Submissions')))
const TeacherRejectedMarks = withSuspense(lazy(() => import('../pages/teacher/RejectedMarks')))
const TeacherInvigilation = withSuspense(lazy(() => import('../pages/teacher/Invigilation')))
const TeacherIncidents = withSuspense(lazy(() => import('../pages/teacher/Incidents')))
const TeacherWorkload = withSuspense(lazy(() => import('../pages/teacher/Workload')))

const StudentDashboard = withSuspense(lazy(() => import('../pages/student/Dashboard')))
const StudentAttendance = withSuspense(lazy(() => import('../pages/student/Attendance')))
const StudentResults = withSuspense(lazy(() => import('../pages/student/Results')))
const ResultDetail = withSuspense(lazy(() => import('../pages/student/ResultDetail')))
const ResultHistory = withSuspense(lazy(() => import('../pages/student/History')))
const Marksheet = withSuspense(lazy(() => import('../pages/student/Marksheet')))
const MarksheetDetail = withSuspense(lazy(() => import('../pages/student/MarksheetDetail')))
const QrVerification = withSuspense(lazy(() => import('../pages/student/QrVerification')))
const StudentRevaluations = withSuspense(lazy(() => import('../pages/student/Revaluations')))
const StudentJourney = withSuspense(lazy(() => import('../pages/student/Journey')))

const Notifications = withSuspense(lazy(() => import('../pages/common/Notifications')))
const Profile = withSuspense(lazy(() => import('../pages/common/Profile')))
const Settings = withSuspense(lazy(() => import('../pages/common/Settings')))

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      { path: 'login', element: <Login /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: 'verify-result', element: <VerifyResult /> },
      { path: '403', element: <Forbidden /> },
      { path: '404', element: <NotFound /> },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    path: '/admin',
    element: <ProtectedRoute />,
    children: [
      {
        element: <RoleRoute role={ROLES.ADMIN} />,
        children: [
          {
            path: '',
            element: <DashboardLayout />,
            children: [
              { index: true, element: <Navigate to="/admin/dashboard" replace /> },
              { path: 'dashboard', element: <AdminDashboard /> },
              { path: 'exam-command-center', element: <ExamCommandCenter /> },
              { path: 'alerts', element: <SmartAlerts /> },
              { path: 'anomalies', element: <AcademicAnomalies /> },
              { path: 'exam-calendar', element: <ExamCalendar /> },
              { path: 'seating-arrangement', element: <SeatingArrangement /> },
              { path: 'invigilators', element: <Invigilators /> },
              { path: 'exam-day', element: <ExamDay /> },
              { path: 'incidents', element: <AdminIncidents /> },
              { path: 'result-integrity', element: <ResultIntegrity /> },
              { path: 'teacher-workload', element: <AdminTeacherWorkload /> },
              { path: 'students', element: <Students /> },
              { path: 'attendance', element: <AdminAttendance /> },
              { path: 'teachers', element: <Teachers /> },
              { path: 'departments', element: <Departments /> },
              { path: 'classes', element: <Classes /> },
              { path: 'subjects', element: <Subjects /> },
              { path: 'exams', element: <Exams /> },
              { path: 'marks', element: <AdminMarks /> },
              { path: 'assignments', element: <AdminAssignments /> },
              { path: 'results', element: <AdminResults /> },
              { path: 'results/verification', element: <ResultVerification /> },
              { path: 'reports', element: <AdminReports /> },
              { path: 'analytics', element: <AdminAnalytics /> },
              { path: 'audit', element: <AuditLogs /> },
              { path: 'revaluations', element: <AdminRevaluations /> },
              { path: 'import', element: <Import /> },
              { path: 'notifications', element: <Notifications /> },
              { path: 'settings', element: <Settings /> },
              { path: 'profile', element: <Profile /> },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '/teacher',
    element: <ProtectedRoute />,
    children: [
      {
        element: <RoleRoute role={ROLES.TEACHER} />,
        children: [
          {
            path: '',
            element: <DashboardLayout />,
            children: [
              { index: true, element: <Navigate to="/teacher/dashboard" replace /> },
              { path: 'dashboard', element: <TeacherDashboard /> },
              { path: 'attendance', element: <TeacherAttendance /> },
              { path: 'assignments', element: <TeacherAssignments /> },
              { path: 'assignments/:id', element: <AssignmentDetail /> },
              { path: 'marks', element: <MarksEntryHome /> },
              { path: 'marks/:assignmentId', element: <MarksEntry /> },
              { path: 'submissions', element: <TeacherSubmissions /> },
              { path: 'rejected-marks', element: <TeacherRejectedMarks /> },
              { path: 'invigilation', element: <TeacherInvigilation /> },
              { path: 'incidents', element: <TeacherIncidents /> },
              { path: 'workload', element: <TeacherWorkload /> },
              { path: 'notifications', element: <Notifications /> },
              { path: 'settings', element: <Settings /> },
              { path: 'profile', element: <Profile /> },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '/student',
    element: <ProtectedRoute />,
    children: [
      {
        element: <RoleRoute role={ROLES.STUDENT} />,
        children: [
          {
            path: '',
            element: <DashboardLayout />,
            children: [
              { index: true, element: <Navigate to="/student/dashboard" replace /> },
              { path: 'dashboard', element: <StudentDashboard /> },
              { path: 'attendance', element: <StudentAttendance /> },
              { path: 'results', element: <StudentResults /> },
              { path: 'results/:id', element: <ResultDetail /> },
              { path: 'history', element: <ResultHistory /> },
              { path: 'journey', element: <StudentJourney /> },
              { path: 'marksheet', element: <Marksheet /> },
              { path: 'marksheet/:id', element: <MarksheetDetail /> },
              { path: 'revaluation', element: <StudentRevaluations /> },
              { path: 'qr', element: <QrVerification /> },
              { path: 'notifications', element: <Notifications /> },
              { path: 'settings', element: <Settings /> },
              { path: 'profile', element: <Profile /> },
            ],
          },
        ],
      },
    ],
  },
])