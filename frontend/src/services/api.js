import axios from 'axios'
import { APP_CONFIG } from '../constants/config'

const api = axios.create({
  baseURL: APP_CONFIG.apiBaseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

const TOKEN_KEY = 'examora_token'

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      const currentPath = window.location.pathname
      if (!currentPath.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export function getUserFriendlyMessage(error) {
  if (!error) return 'An unexpected error occurred. Please try again.'

  if (error.code === 'ECONNABORTED') {
    return 'The request timed out. Please check your connection and try again.'
  }
  if (!error.response && error.message === 'Network Error') {
    return 'Unable to reach the server. Please check if the backend is running and your internet connection.'
  }

  const status = error.response?.status
  const backendMessage = error.response?.data?.message || error.response?.data?.error

  const messages = {
    400: backendMessage || 'Invalid request. Please review your input.',
    401: 'Your session has expired. Please sign in again.',
    403: backendMessage || 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    409: backendMessage || 'This record already exists or conflicts with existing data.',
    422: backendMessage || 'Please fix the validation errors and try again.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'Something went wrong on the server. Please try again later.',
    502: 'The server is temporarily unavailable. Please try again shortly.',
    503: 'The service is temporarily down. Please try again later.',
  }

  return messages[status] || backendMessage || 'An unexpected error occurred. Please try again.'
}

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export default api
