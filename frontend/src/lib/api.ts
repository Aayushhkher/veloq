import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data: RegisterData) => api.post('/auth/register', data),
  login: (data: LoginData) => api.post('/auth/login', data),
  googleAuth: (code: string, redirectUri: string) =>
    api.post('/auth/google', { code, redirect_uri: redirectUri }),
  getMe: () => api.get('/auth/me'),
  getGoogleUrl: () => api.get('/auth/google/url'),
}

// ─── User ─────────────────────────────────────────────────────────────────────
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data: Partial<UserProfile>) => api.patch('/user/profile', data),
  getTransactions: (skip = 0, limit = 20) =>
    api.get(`/user/wallet/transactions?skip=${skip}&limit=${limit}`),
  requestWithdrawal: (amount: number, upi_id: string) =>
    api.post('/user/wallet/withdraw', { amount, upi_id }),
  getWithdrawals: () => api.get('/user/wallet/withdrawals'),
  getCompletedSurveys: () => api.get('/user/completed-surveys'),
}

// ─── Survey ───────────────────────────────────────────────────────────────────
export const surveyAPI = {
  getAvailable: (skip = 0, limit = 20, category?: string) => {
    let url = `/survey/available?skip=${skip}&limit=${limit}`
    if (category) url += `&category=${category}`
    return api.get(url)
  },
  getById: (id: number) => api.get(`/survey/${id}`),
  submit: (id: number, answers: Record<string, any>, timeTaken?: number) =>
    api.post(`/survey/${id}/submit`, { answers, time_taken_seconds: timeTaken }),
  createSurvey: (data: SurveyCreateData) => api.post('/survey/company/create', data),
  getCompanySurveys: () => api.get('/survey/company/list'),
  getAnalytics: (surveyId: number) => api.get(`/survey/company/${surveyId}/analytics`),
}

// ─── Company ──────────────────────────────────────────────────────────────────
export const companyAPI = {
  getProfile: () => api.get('/company/profile'),
  updateProfile: (data: any) => api.patch('/company/profile', data),
  getDashboard: () => api.get('/company/dashboard'),
  createOrder: (amount: number) => api.post('/company/payment/create-order', { amount }),
  verifyPayment: (data: PaymentVerifyData) => api.post('/company/payment/verify', data),
  getTier: () => api.get('/company/tier'),
  setTier: (tier: string) => api.patch('/company/tier', { tier }),
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (skip = 0, limit = 50) => api.get(`/admin/users?skip=${skip}&limit=${limit}`),
  getSurveys: (status?: string) => {
    let url = '/admin/surveys'
    if (status) url += `?status=${status}`
    return api.get(url)
  },
  surveyAction: (surveyId: number, action: string, rejectionReason?: string) =>
    api.post(`/admin/surveys/${surveyId}/action`, { action, rejection_reason: rejectionReason }),
  getWithdrawals: (status?: string) => {
    let url = '/admin/withdrawals'
    if (status) url += `?status=${status}`
    return api.get(url)
  },
  withdrawalAction: (id: number, action: string, notes?: string) =>
    api.post(`/admin/withdrawals/${id}/action`, { action, admin_notes: notes }),
  toggleUserStatus: (userId: number) => api.patch(`/admin/users/${userId}/toggle`),
}

// ─── Compliance ───────────────────────────────────────────────────────────────
export const complianceAPI = {
  getConsents: () => api.get('/compliance/consent'),
  grantConsent: (data: any) => api.post('/compliance/consent/grant', data),
  updateMarketing: (granted: boolean) => api.patch('/compliance/consent/marketing', { marketing: granted }),
  exportData: () => api.get('/compliance/data/export', { responseType: 'blob' }),
  deleteAccount: () => api.delete('/compliance/account/delete'),
  submitKYC: (data: any) => api.post('/compliance/kyc/submit', data),
  getKYCStatus: () => api.get('/compliance/kyc/status'),
  getTDSStatus: () => api.get('/compliance/tds/status'),
  downloadTDSCert: () => api.get('/compliance/tds/certificate', { responseType: 'blob' }),
  submitGrievance: (data: any) => api.post('/compliance/grievance', data),
  getMyGrievances: () => api.get('/compliance/grievance/my'),
  // Admin
  getGrievances: (status?: string) => api.get(`/compliance/admin/grievances${status ? `?status=${status}` : ''}`),
  updateGrievance: (id: number, data: any) => api.patch(`/compliance/admin/grievances/${id}`, data),
  getBreaches: () => api.get('/compliance/admin/breaches'),
  logBreach: (data: any) => api.post('/compliance/admin/breach', data),
  getBreachReport: (id: number) => api.get(`/compliance/admin/breach/${id}/report`, { responseType: 'blob' }),
  getReviews: (status?: string) => api.get(`/compliance/admin/reviews${status ? `?status=${status}` : ''}`),
  removeReview: (id: number, reason: string) => api.patch(`/compliance/admin/reviews/${id}/remove?reason=${encodeURIComponent(reason)}`),
  exportAuditTrail: () => api.get('/compliance/admin/audit-trail', { responseType: 'blob' }),
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface RegisterData {
  email: string
  full_name: string
  password: string
  role: 'user' | 'company'
}

export interface LoginData {
  email: string
  password: string
}

export interface UserProfile {
  full_name: string
  phone: string
  upi_id?: string
  created_at: string
  kyc_status?: string
  subscription_tier?: string | null
}

export interface SurveyCreateData {
  title: string
  description?: string
  category?: string
  reward_per_response: number
  max_responses: number
  estimated_time_minutes: number
  questions: QuestionData[]
}

export interface QuestionData {
  question_text: string
  question_type: 'mcq' | 'checkbox' | 'rating' | 'text' | 'scale'
  options?: string[]
  is_required: boolean
  order: number
  min_value?: number
  max_value?: number
}

export interface PaymentVerifyData {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

export default api
