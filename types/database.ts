// ============================================================
// Enums (matching Supabase enums)
// ============================================================
export type PlanType = 'free' | 'pro' | 'business'
export type VideoStatus = 'uploaded' | 'processing' | 'ready' | 'failed'
export type ClipStatus = 'pending' | 'generating' | 'ready' | 'failed'
export type JobType = 'transcription' | 'clip_generation' | 'subtitle_burn'
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'

// ============================================================
// Tables
// ============================================================
export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  plan: PlanType
  credits_remaining: number
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
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
  video_id: string
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
