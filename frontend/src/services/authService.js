import api from './api'

export const authService = {
  login: (email, password) => {
    // Backend expects { username, password }, but frontend sends email/username
    // Allow login with either email or username
    return api.post('/auth/login/', {
      username: email,
      password,
    })
  },
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  getMe: () => api.get('/auth/me/'),
  logout: (refreshToken) => {
    // Backend requires { refresh: "<refresh_token>" }
    return api.post('/auth/logout/', {
      refresh: refreshToken,
    })
  },
}
