import api from './api'

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
}
