'use client'

import { useTranslation } from 'react-i18next'
import { ArrowLeft, Wand2, Loader2, Check } from 'lucide-react'
import { useEditor } from '../EditorProvider'
import { formatTime, cn } from '@/lib/utils'

interface EditorToolbarProps {
  onClose: () => void
  onGenerate: () => void
  generating: boolean
  generatingDone: boolean
  generatingLabel: string | null
  disabled?: boolean
}

export function EditorToolbar({
  onClose,
  onGenerate,
  generating,
  generatingDone,
  generatingLabel,
  disabled,
}: EditorToolbarProps) {
  const { t } = useTranslation()
  const { state, totalDuration } = useEditor()
  const { segments } = state

  return (
    <div className="flex flex-shrink-0 items-center justify-between border-b border-white/10 bg-slate-950/80 px-4 py-3 backdrop-blur-sm">
      {/* Gauche : retour + titre */}
      <div className="flex items-center gap-3">
        <button
          onClick={onClose}
          disabled={generating || generatingDone}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/5 text-white transition-colors hover:bg-white/10 disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <h1 className="text-lg font-semibold text-white">{t('editor.toolbar.customizeClip')}</h1>
      </div>

      {/* Centre : info */}
      <div className="text-sm text-white/50">
        {t('editor.toolbar.segmentInfo', { count: segments.length, duration: formatTime(totalDuration) })}
      </div>

      {/* Droite : générer */}
      <button
        onClick={onGenerate}
        disabled={generating || disabled || generatingDone}
        className={cn(
          'flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all',
          generating || disabled || generatingDone
            ? 'bg-white/10 text-white/40 cursor-not-allowed'
            : 'bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:scale-105 hover:shadow-lg hover:shadow-orange-500/25'
        )}
      >
        {generatingDone ? (
          <>
            <Check className="h-4 w-4" />
            {t('editor.toolbar.clipCreated')}
          </>
        ) : generating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {generatingLabel || t('editor.toolbar.generating')}
          </>
        ) : (
          <>
            <Wand2 className="h-4 w-4" />
            {t('editor.toolbar.generate')}
          </>
        )}
      </button>
    </div>
  )
}
