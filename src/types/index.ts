// Re-export all types from a single entry point
export * from './database'

// API response types
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
}

// Analytics types (used in dashboard)
export interface AnalyticsData {
  total_scans: number
  total_scans_today: number
  total_scans_week: number
  total_scans_month: number
  average_rating: number
  conversion_rate: number
  reviews_this_month: number
  rating_distribution: {
    rating: number
    count: number
  }[]
}

// AI review generation types
export interface GenerateReviewRequest {
  business_id: string
  business_name: string
  selected_tags: string[]
}

export interface GenerateReviewResponse {
  variants: string[]
}

// Review submission types
export interface SubmitReviewRequest {
  business_id: string
  rating: number
  selected_tags?: string[]
  ai_variant_chosen?: string
  redirected_to_google?: boolean
  // For negative path
  message?: string
  contact_info?: string
}
