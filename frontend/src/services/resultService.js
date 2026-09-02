import api from './api'

export const resultService = {
  getVerifications: (params) => api.get('/results/verification', { params }),
  review: (id) => api.get(`/results/verification/${id}`),
  approve: (id) => api.post(`/results/${id}/approve`),
  reject: (id, reason) => api.post(`/results/${id}/reject`, { reason }),
  getReadyToPublish: (params) => api.get('/results/ready-to-publish', { params }),
  publish: (id) => api.post(`/results/${id}/publish`),
  getPublished: (params) => api.get('/results', { params }),
  getResultDetail: (id) => api.get(`/results/${id}`),
  getDashboardAnalytics: () => api.get('/results/analytics'),
}
