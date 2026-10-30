// Database types matching the PostgreSQL / Prisma schema

export type UserRole = 'super_admin' | 'business_owner'
export type PlanType = 'free' | 'pro' | 'enterprise'
export type FeedbackStatus = 'open' | 'resolved'

export interface Profile {
  id: string
  full_name: string | null
  role: UserRole
  created_at: string
}

export interface Business {
  id: string
  owner_id: string
  name: string
  slug: string
  google_review_link: string
  logo_url: string | null
  accent_color: string
  plan: PlanType
  is_active: boolean
  created_at: string
}

export interface ServiceTag {
  id: string
  business_id: string
  label: string
  tag_type: 'service' | 'category'
  created_at: string
}

export interface QrScan {
  id: string
  business_id: string
  scanned_at: string
  user_agent: string | null
}

export interface Review {
  id: string
  business_id: string
  rating: number
  selected_tags: string[] | null
  ai_variant_chosen: string | null
  redirected_to_google: boolean
  created_at: string
}

export interface Feedback {
  id: string
  business_id: string
  rating: number
  message: string | null
  contact_info: string | null
  status: FeedbackStatus
  created_at: string
}

