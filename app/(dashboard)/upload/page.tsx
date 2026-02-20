'use client'

import { useTranslation } from 'react-i18next'
import { VideoUploader } from '@/components/VideoUploader'

export default function UploadPage() {
  const { t } = useTranslation()

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white md:text-4xl">
          {t('upload.title')}
        </h1>
        <p className="mt-2 text-lg text-white/60">
          {t('upload.subtitle')}
        </p>
      </div>
      <VideoUploader />
    </div>
  )
}
