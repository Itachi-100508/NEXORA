import api from './api'

export const verificationService = {
  verifyCode: (code) => api.get('/results/verify', { params: { code } }),
}