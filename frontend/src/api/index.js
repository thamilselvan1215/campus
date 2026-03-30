/**
 * api/index.js — Axios client for AutoFix Campus backend
 */
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 30000,
})

api.interceptors.request.use(config => {
  const userStr = localStorage.getItem('autofix_user')
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`
      }
    } catch (e) {}
  }
  return config
})

// ── Complaints ──────────────────────────────────────────────────────────────
export const submitComplaint = (formData) => api.post('/complaints/', formData)
export const listComplaints = () => api.get('/complaints/')
export const getComplaint = (id) => api.get(`/complaints/${id}`)
export const updateStatus = (id, status) => api.patch(`/complaints/${id}/status`, { status })
export const verifyComplaint = (id, formData) => api.post(`/complaints/${id}/verify`, formData)
export const escalateComplaint = (id) => api.post(`/complaints/${id}/escalate`)
export const rejectComplaint = (id, reason) => api.post(`/complaints/${id}/reject`, { reason })
export const simulateChaos = (count = 10) => api.post('/complaints/simulate', null, { params: { count } })

// ── Ratings ─────────────────────────────────────────────────────────────────
export const rateComplaint = (id, rating) => api.post(`/complaints/${id}/rate`, { rating })

// ── Staff ────────────────────────────────────────────────────────────────────
export const listStaff = () => api.get('/staff/')
export const getStaffTasks = (staffId) => api.get(`/staff/${staffId}/tasks`)

// ── Dashboard ────────────────────────────────────────────────────────────────
export const getDashboardStats = () => api.get('/dashboard/stats')
export const getHeatmap = () => api.get('/dashboard/heatmap')
export const getCategories = () => api.get('/dashboard/categories')
export const getSLABreaches = () => api.get('/dashboard/sla_breaches')
export const getLeaderboard = () => api.get('/dashboard/leaderboard')
export const getAISummary   = () => api.get('/dashboard/summary')

// ── Chatbot ───────────────────────────────────────────────────────────────────
export const sendChatMessage = (message, state) => api.post('/chatbot/message', { message, state })

// ── Events ───────────────────────────────────────────────────────────────────
export const getTodayEvent = () => api.get('/events/today')

// ── Auth ─────────────────────────────────────────────────────────────────────
export const login = (role, name) => api.post('/auth/login', { role, name })
export const logout = () => api.post('/auth/logout')

export default api
