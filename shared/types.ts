/**
 * Shared type definitions for SurveyMarket platform.
 * These mirror the Pydantic schemas in the backend.
 */

// ─── Auth ─────────────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'company' | 'admin'

export interface User {
  id: number
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
  is_verified: boolean
  avatar_url?: string
  wallet_balance: number
  total_earned: number
  surveys_completed: number
  upi_id?: string
  phone?: string
  created_at: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

// ─── Company ──────────────────────────────────────────────────────────────────

export interface Company {
  id: number
  user_id: number
  company_name: string
  description?: string
  website?: string
  logo_url?: string
  industry?: string
  wallet_balance: number
  total_deposited: number
  total_spent: number
  is_verified: boolean
  created_at: string
}

// ─── Survey ───────────────────────────────────────────────────────────────────

export type SurveyStatus = 'draft' | 'pending' | 'active' | 'paused' | 'completed' | 'rejected'
export type QuestionType = 'mcq' | 'checkbox' | 'rating' | 'text' | 'scale'

export interface Question {
  id: number
  question_text: string
  question_type: QuestionType
  options?: string[]
  is_required: boolean
  order: number
  min_value?: number
  max_value?: number
}

export interface Survey {
  id: number
  company_id: number
  title: string
  description?: string
  category?: string
  reward_per_response: number
  max_responses: number
  current_responses: number
  total_budget: number
  estimated_time_minutes: number
  status: SurveyStatus
  is_active: boolean
  company_name?: string
  questions: Question[]
  created_at: string
}

export interface SurveyListItem {
  id: number
  title: string
  description?: string
  category?: string
  reward_per_response: number
  max_responses: number
  current_responses: number
  estimated_time_minutes: number
  status: SurveyStatus
  company_name?: string
  created_at: string
}

// ─── Wallet ───────────────────────────────────────────────────────────────────

export type TransactionType = 'survey_reward' | 'withdrawal' | 'deposit' | 'commission' | 'refund'
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'reversed'
export type WithdrawalStatus = 'pending' | 'approved' | 'processing' | 'completed' | 'rejected'

export interface WalletTransaction {
  id: number
  transaction_type: TransactionType
  amount: number
  balance_after: number
  description?: string
  reference_id?: string
  status: TransactionStatus
  created_at: string
}

export interface Withdrawal {
  id: number
  amount: number
  upi_id: string
  status: WithdrawalStatus
  admin_notes?: string
  requested_at: string
  processed_at?: string
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface AdminStats {
  total_users: number
  total_companies: number
  total_surveys: number
  active_surveys: number
  total_responses: number
  total_revenue: number
  pending_withdrawals: number
  platform_earnings: number
}

// ─── API Errors ───────────────────────────────────────────────────────────────

export interface APIError {
  detail: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const PLATFORM_COMMISSION_PERCENT = 10
export const MIN_WITHDRAWAL_AMOUNT = 100
export const SURVEY_CATEGORIES = [
  'Technology', 'Health', 'Finance', 'Education',
  'Food', 'Lifestyle', 'Entertainment', 'Sports', 'Other'
] as const
