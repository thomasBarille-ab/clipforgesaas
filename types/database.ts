// ============================================================
// Enums (matching Supabase enums)
// ============================================================
export type PlanType = 'free' | 'pro' | 'business'
export type NotificationType =
  | 'clip_ready'
  | 'subscription_started'
  | 'subscription_changed'
  | 'subscription_canceled'
  | 'invoice_paid'
  | 'payment_failed'
  | 'expiry_warning'
export type VideoStatus = 'uploaded' | 'processing' | 'ready' | 'failed'
export type ClipStatus = 'pending' | 'generating' | 'ready' | 'failed'
export type JobType = 'transcription' | 'clip_generation' | 'subtitle_burn'
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'

// ============================================================
// Branding (Business plan)
// ============================================================
export type BrandingPosition = 'center' | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'

export interface BrandingConfig {
  enabled: boolean
  text: string
  logoPath: string | null
  position: BrandingPosition
  showLogo: boolean
  showText: boolean
  textColor: string
  textOpacity: number
}

// ============================================================
// Tables
// ============================================================
export type NotificationEmailPreferences = Partial<Record<NotificationType, boolean>>

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  metadata: Record<string, unknown>
  read: boolean
  created_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  plan: PlanType
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  branding_config: BrandingConfig | null
  notification_email_preferences: NotificationEmailPreferences | null
  created_at: string
  updated_at: string
}

export interface Video {
  id: string
  user_id: string
  title: string
  original_filename: string
  storage_path: string
  duration_seconds: number | null
  file_size_bytes: number
  status: VideoStatus
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Transcription {
  id: string
  video_id: string
  full_text: string
  segments: TranscriptionSegment[]
  language: string
  confidence_score: number | null
  created_at: string
}

export interface TranscriptionSegment {
  start: number
  end: number
  text: string
}

export interface Clip {
  id: string
  video_id: string | null
  user_id: string
  title: string
  description: string | null
  hashtags: string[]
  start_time_seconds: number
  end_time_seconds: number
  storage_path: string | null
  thumbnail_path: string | null
  subtitle_style: string
  status: ClipStatus
  virality_score: number | null
  suggestion_data: SuggestionData | null
  created_at: string
  updated_at: string
}

export interface SuggestionData {
  title: string
  description: string
  hashtags: string[]
  score: number
}

export interface CreatorPersona {
  id: string
  user_id: string
  persona_summary: string
  clip_count: number
  created_at: string
  updated_at: string
}

export interface ProcessingJob {
  id: string
  user_id: string
  video_id: string | null
  clip_id: string | null
  job_type: JobType
  status: JobStatus
  progress_percent: number
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

// ============================================================
// Insert types (omit server-generated fields)
// ============================================================
export type VideoInsert = Omit<Video, 'id' | 'created_at' | 'updated_at'>
export type ClipInsert = Omit<Clip, 'id' | 'created_at' | 'updated_at'>
export type ProcessingJobInsert = Omit<ProcessingJob, 'id' | 'created_at'>

// ============================================================
// Client-side UI types
// ============================================================
export type UploadStatus = 'idle' | 'uploading' | 'saving' | 'success' | 'error'

// ============================================================
// Shared join types (used across multiple pages)
// ============================================================
export interface VideoWithClips extends Video {
  clips: Clip[]
}

export interface ClipWithVideo extends Clip {
  video: { title: string } | null
}

export interface ClipSuggestion {
  start: number
  end: number
  title: string
  description: string
  hashtags: string[]
  score: number
}
