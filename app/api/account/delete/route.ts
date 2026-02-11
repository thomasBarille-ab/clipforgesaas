import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function DELETE() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { error: 'Vous devez être connecté' },
      { status: 401 }
    )
  }

  try {
    // Supprimer les fichiers Storage de l'utilisateur
    const { data: files } = await supabase.storage
      .from('videos')
      .list(user.id, { limit: 1000 })

    if (files && files.length > 0) {
      const paths = files.map((f) => `${user.id}/${f.name}`)
      await supabase.storage.from('videos').remove(paths)
    }

    // Supprimer les sous-dossiers (thumbnails, clips)
    for (const folder of ['thumbnails', 'clips']) {
      const { data: subFiles } = await supabase.storage
        .from('videos')
        .list(`${user.id}/${folder}`, { limit: 1000 })

      if (subFiles && subFiles.length > 0) {
        const subPaths = subFiles.map((f) => `${user.id}/${folder}/${f.name}`)
        await supabase.storage.from('videos').remove(subPaths)
      }
    }

    // Sous-dossier thumbnails/clips
    const { data: thumbClipFiles } = await supabase.storage
      .from('videos')
      .list(`${user.id}/thumbnails/clips`, { limit: 1000 })

    if (thumbClipFiles && thumbClipFiles.length > 0) {
      const thumbClipPaths = thumbClipFiles.map((f) => `${user.id}/thumbnails/clips/${f.name}`)
      await supabase.storage.from('videos').remove(thumbClipPaths)
    }

    // Les données DB (videos, clips, transcriptions, jobs) sont supprimées
    // en cascade grâce au ON DELETE CASCADE sur profiles.id

    // Supprimer l'utilisateur auth via le service role
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: 'Configuration serveur manquante' },
        { status: 500 }
      )
    }

    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    )

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)
    if (deleteError) {
      console.error('Delete user error:', deleteError)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression du compte' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la suppression' },
      { status: 500 }
    )
  }
}
