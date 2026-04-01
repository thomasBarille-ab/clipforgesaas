import { createClient } from '@supabase/supabase-js'
import type { NotificationType, NotificationEmailPreferences } from '@/types/database'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const DEFAULT_EMAIL_PREFERENCES: NotificationEmailPreferences = {
  expiry_warning: true,
}

/**
 * Create an in-app notification and optionally dispatch an email
 * if the user has email enabled for this notification type.
 *
 * @param userId - The user's profile ID
 * @param type - The notification type
 * @param title - Short title displayed in the dropdown
 * @param message - Longer description message
 * @param metadata - Optional JSON metadata
 * @returns true if notification was created successfully
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  metadata?: Record<string, unknown>
): Promise<boolean> {
  const supabase = getAdminClient()

  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message,
      metadata: metadata ?? {},
    })

  if (error) {
    console.error('Failed to create notification:', error)
    return false
  }

  return true
}

/**
 * Check if a user has email notifications enabled for a given type.
 * Returns true if enabled, false otherwise.
 * Default: only expiry_warning is ON.
 */
export async function isEmailEnabledForType(
  userId: string,
  type: NotificationType
): Promise<boolean> {
  const supabase = getAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('notification_email_preferences')
    .eq('id', userId)
    .single()

  const prefs = (profile?.notification_email_preferences as NotificationEmailPreferences | null)
    ?? DEFAULT_EMAIL_PREFERENCES

  return prefs[type] === true
}
