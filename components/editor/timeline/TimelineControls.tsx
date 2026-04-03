'use client'

import { useEditor } from '../EditorProvider'
import { formatTime } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

interface TimelineControlsProps {
  containerWidth: number
}

export function TimelineControls({ containerWidth: _containerWidth }: TimelineControlsProps) {
  const { t } = useTranslation()
  const { totalDuration } = useEditor()

  return (
    <div className="mt-2 flex items-center justify-end rounded-lg bg-slate-950/60 px-4 py-2">
      <div className="text-xs text-white/40">
        {t('editor.toolbar.totalDuration')} : {formatTime(totalDuration)}
      </div>
    </div>
  )
}
