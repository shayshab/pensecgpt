import axios from 'axios'
import { supabase } from './supabase'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: `${apiUrl}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  // Skip authentication in development mode
  if (process.env.NODE_ENV === 'development') {
    // Don't require auth token in development
    return config
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }

  return config
})

// API functions
export const projectsApi = {
  getAll: () => api.get('/projects'),
  getById: (id: string) => api.get(`/projects/${id}`),
  create: (data: any) => api.post('/projects', data),
  update: (id: string, data: any) => api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
}

export const scansApi = {
  getAll: (params?: any) => api.get('/scans', { params }),
  getById: (id: string) => api.get(`/scans/${id}`),
  create: (data: any) => api.post('/scans', data),
  cancel: (id: string) => api.post(`/scans/${id}/cancel`),
  getStatus: (id: string) => api.get(`/scans/${id}/status`),
}

export const vulnerabilitiesApi = {
  getAll: (params?: any) => api.get('/vulnerabilities', { params }),
  getById: (id: string) => api.get(`/vulnerabilities/${id}`),
  update: (id: string, data: any) => api.put(`/vulnerabilities/${id}`, data),
  getByProject: (projectId: string) =>
    api.get(`/vulnerabilities/project/${projectId}`),
}

export const reportsApi = {
  getByScan: (scanId: string) => api.get(`/reports/scan/${scanId}`),
  generate: (scanId: string, reportType: string) =>
    api.post(`/reports/scan/${scanId}/generate`, { report_type: reportType }),
}

