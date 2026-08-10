import axios from 'axios'

// const BASE = import.meta.env.VITE_API_BASE_URL || 'https://foxvue-backend-gnddgbgcazgtg5dn.southafricanorth-01.azurewebsites.net'
const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
// ── Axios instance with automatic JWT injection ───────────────────────────────
const api = axios.create({ baseURL: BASE })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dojo_token') || sessionStorage.getItem('dojo_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-logout on 401 — only redirect if the user had a token (not a guest)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const hadToken = localStorage.getItem('dojo_token') || sessionStorage.getItem('dojo_token')
      localStorage.removeItem('dojo_token')
      localStorage.removeItem('dojo_remembered_email')
      sessionStorage.removeItem('dojo_token')
      sessionStorage.removeItem('dojo_guest')
      // Only hard-redirect if the user had a real token (expired/invalid).
      // If they were a guest hitting a protected endpoint, let the component
      // handle the error gracefully instead of bouncing them to login.
      if (hadToken) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

// ── Auth endpoints ────────────────────────────────────────────────────────────

export function apiSignup(name, email) {
  return api.post('/api/auth/signup', { name, email }).then((r) => r.data)
}

export function apiCompleteRegistration(email, password) {
  return api.post('/api/auth/complete-registration', { email, password }).then((r) => r.data)
}

export function apiCheckCode(email, code) {
  return api.post('/api/auth/check-code', { email, code }).then((r) => r.data)
}

export function apiVerifyEmail(email, code) {
  return api.post('/api/auth/verify-email', { email, code }).then((r) => r.data)
}

export function apiResendVerification(email) {
  return api.post('/api/auth/resend-verification', { email }).then((r) => r.data)
}

export function apiLogin(email, password) {
  return api.post('/api/auth/login', { email, password }).then((r) => r.data)
}

export function apiForgotPassword(email) {
  return api.post('/api/auth/forgot-password', { email }).then((r) => r.data)
}

export function apiResetPassword(token, password) {
  return api.post('/api/auth/reset-password', { token, password }).then((r) => r.data)
}

export function apiGetMe() {
  return api.get('/api/auth/me').then((r) => r.data)
}

export function getTrialStatus() {
  return api.get('/api/trial/status').then((r) => r.data)
}

export function getQuota() {
  return api.get('/api/quota').then((r) => r.data)
}

// ── Interview endpoints ───────────────────────────────────────────────────────

export function generateQuestions(sessionId, jobTitle, jobDescription) {
  return api.post('/api/interview/generate-questions', { sessionId, jobTitle, jobDescription }).then((r) => r.data)
}

export function evaluateAnswer({ sessionId, question, transcript }) {
  return api.post('/api/interview/evaluate-answer', { sessionId, question, transcript }).then((r) => r.data)
}

export function transcribeAudio(audioBlob) {
  const form = new FormData()
  form.append('audio', audioBlob, 'recording.webm')
  return api.post('/api/transcribe', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data.transcript)
}

export function fetchHistory(sessionId) {
  return api.get('/api/interview/history', { params: { sessionId } }).then((r) => r.data)
}

export function fetchAllSessions() {
  return api.get('/api/interview/sessions').then((r) => r.data.sessions)
}

export function deleteSession(sessionId) {
  return api.delete(`/api/interview/sessions/${sessionId}`).then((r) => r.data)
}

// ── API Key management (BYOK) ─────────────────────────────────────────────────

export function listAPIKeys() {
  return api.get('/api/apikeys').then((r) => r.data.keys)
}

export function saveAPIKey(provider, apiKey) {
  return api.post('/api/apikeys', { provider, apiKey }).then((r) => r.data)
}

export function testAPIKey(id) {
  return api.post(`/api/apikeys/${id}/test`).then((r) => r.data)
}

export function activateAPIKey(id) {
  return api.post(`/api/apikeys/${id}/activate`).then((r) => r.data)
}

export function deleteAPIKey(id) {
  return api.delete(`/api/apikeys/${id}`).then((r) => r.data)
}

// ── WebSocket live session ────────────────────────────────────────────────────

export function createLiveSession({ onQuestion, onFeedback, onError }) {
  const wsBase = BASE.replace(/^http/, 'ws')
  const token = localStorage.getItem('dojo_token')
  const ws = new WebSocket(`${wsBase}/api/ws?token=${token ?? ''}`)

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      const payload = JSON.parse(msg.payload ?? '{}')
      if (msg.type === 'question') onQuestion?.(payload)
      else if (msg.type === 'feedback') onFeedback?.(payload)
      else if (msg.type === 'error') onError?.(payload)
    } catch { /* ignore */ }
  }

  ws.onerror = () => onError?.({ message: 'WebSocket connection error' })

  return {
    start: (jobDescription) =>
      ws.send(JSON.stringify({ type: 'start', payload: JSON.stringify({ jobDescription }) })),
    sendTranscript: (text) =>
      ws.send(JSON.stringify({ type: 'transcript', payload: JSON.stringify({ text }) })),
    next: () =>
      ws.send(JSON.stringify({ type: 'next', payload: '{}' })),
    close: () => ws.close(),
  }
}
