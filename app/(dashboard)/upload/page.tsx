import type { Metadata } from 'next'
import { VideoUploader } from '@/components/VideoUploader'

export const metadata: Metadata = {
  title: 'Importer une vidéo - ClipForge',
  description: 'Importez votre vidéo pour créer des clips automatiquement',
}

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white md:text-4xl">
          Importer une vidéo
        </h1>
        <p className="mt-2 text-lg text-white/60">
          Glissez-déposez votre vidéo ou cliquez pour parcourir vos fichiers
        </p>
      </div>
      <VideoUploader />
    </div>
  )
}
