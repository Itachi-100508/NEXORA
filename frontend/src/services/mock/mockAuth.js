import { ROLES } from '../../constants'

const MOCK_ACCOUNTS = {
  'admin@examora.edu': {
    role: ROLES.ADMIN,
    name: 'Sarah Mitchell',
    email: 'admin@examora.edu',
    roleLabel: 'Administrator',
    department: 'Administration',
  },
  'teacher@examora.edu': {
    role: ROLES.TEACHER,
    name: 'James Carter',
    email: 'teacher@examora.edu',
    roleLabel: 'Teacher',
    department: 'Computer Science',
    employeeId: 'EMP-1024',
  },
  'student@examora.edu': {
    role: ROLES.STUDENT,
    name: 'Aisha Khan',
    email: 'student@examora.edu',
    roleLabel: 'Student',
    department: 'Computer Science',
    rollNumber: 'CS-2023-001',
    class: 'SE-I B',
    semester: 3,
  },
}

export function mockLogin(email, password) {
  return new Promise((resolve, reject) => {
    const account = MOCK_ACCOUNTS[email.toLowerCase()]
    if (!account || password !== 'password') {
      setTimeout(() => {
        reject({ message: 'Invalid email or password' })
      }, 600)
      return
    }
    setTimeout(() => {
      resolve({
        token: `mock-token-${account.role.toLowerCase()}-${Date.now()}`,
        user: {
          id: `${account.role.toLowerCase()}-001`,
          ...account,
        },
      })
    }, 700)
  })
}

export function mockGetMe() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ user: null })
    }, 200)
  })
}

export function mockForgotPassword(_email) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ message: 'If this email exists, a reset link has been sent.' })
    }, 700)
  })
}
