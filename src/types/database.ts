// Database types matching the Supabase PostgreSQL schema

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

// Supabase Database type map (for typed client)
// Must match the exact format expected by @supabase/supabase-js v2
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
        Relationships: []
      }
      businesses: {
        Row: Business
        Insert: Omit<Business, 'id' | 'created_at'>
        Update: Partial<Omit<Business, 'id' | 'created_at'>>
        Relationships: [
          {
            foreignKeyName: 'businesses_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      service_tags: {
        Row: ServiceTag
        Insert: Omit<ServiceTag, 'id' | 'created_at'>
        Update: Partial<Omit<ServiceTag, 'id' | 'created_at'>>
        Relationships: [
          {
            foreignKeyName: 'service_tags_business_id_fkey'
            columns: ['business_id']
            isOneToOne: false
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          }
        ]
      }
      qr_scans: {
        Row: QrScan
        Insert: Omit<QrScan, 'id' | 'scanned_at'>
        Update: Partial<Omit<QrScan, 'id' | 'scanned_at'>>
        Relationships: [
          {
            foreignKeyName: 'qr_scans_business_id_fkey'
            columns: ['business_id']
            isOneToOne: false
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          }
        ]
      }
      reviews: {
        Row: Review
        Insert: Omit<Review, 'id' | 'created_at'>
        Update: Partial<Omit<Review, 'id' | 'created_at'>>
        Relationships: [
          {
            foreignKeyName: 'reviews_business_id_fkey'
            columns: ['business_id']
            isOneToOne: false
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          }
        ]
      }
      feedback: {
        Row: Feedback
        Insert: Omit<Feedback, 'id' | 'created_at'>
        Update: Partial<Omit<Feedback, 'id' | 'created_at'>>
        Relationships: [
          {
            foreignKeyName: 'feedback_business_id_fkey'
            columns: ['business_id']
            isOneToOne: false
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
