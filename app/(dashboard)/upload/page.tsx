'use client'

import { useTranslation } from 'react-i18next'
import { Info } from 'lucide-react'
import { VideoUploader } from '@/components/VideoUploader'
import { DashboardHeader } from '@/components/DashboardHeader'

export default function UploadPage() {
  const { t } = useTranslation()

  return (
    <>
      <style jsx>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up-1 { animation: fade-in-up 0.5s ease-out 0.1s both; }
        .animate-fade-in-up-2 { animation: fade-in-up 0.5s ease-out 0.2s both; }
      `}</style>

      <div className="mx-auto max-w-5xl space-y-8">
        <div className="animate-fade-in-up-1 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white md:text-3xl">
              {t('upload.title')}
            </h1>
            <p className="mt-1 text-sm text-white/40">
              {t('upload.subtitle')}
            </p>
          </div>
          <DashboardHeader />
        </div>
        <div className="animate-fade-in-up-2 flex items-start gap-2.5 rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3 text-sm text-orange-300/80">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
          <span>{t('upload.retentionNotice')}</span>
        </div>
        <div className="animate-fade-in-up-2">
          <VideoUploader />
        </div>
      </div>
    </>
  )
}
