import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  // Notifications des 7 derniers jours
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [notificationsRes, unreadRes] = await Promise.all([
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false),
  ])

  if (notificationsRes.error) {
    console.error('Notifications fetch error:', notificationsRes.error)
    return NextResponse.json({ error: 'Erreur lors de la récupération des notifications' }, { status: 500 })
  }

  return NextResponse.json({
    notifications: notificationsRes.data ?? [],
    unreadCount: unreadRes.count ?? 0,
  })
}
