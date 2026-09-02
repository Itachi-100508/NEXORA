import api from './api'

export const importService = {
  parse: (formData) => api.post('/import/parse', formData),
  confirm: (fileId) => api.post(`/import/${fileId}/confirm`),
}