'use client'

import { ArrowLeft, Scissors, Trash2, Wand2, Loader2, Check } from 'lucide-react'
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
  const { state, dispatch, totalDuration, segmentOffsets } = useEditor()
  const { segments, selectedSegmentId, playheadTime } = state

  // Vérifier si le split est possible
  const canSplit = (() => {
    for (let i = 0; i < segments.length; i++) {
      const off = segmentOffsets[i]
      if (playheadTime > off.timelineStart && playheadTime < off.timelineEnd) {
        const seg = segments[i]
        const splitSourceTime = seg.sourceStart + (playheadTime - off.timelineStart)
        return (
          splitSourceTime - seg.sourceStart >= 1 &&
          seg.sourceEnd - splitSourceTime >= 1
        )
      }
    }
    return false
  })()

  const canDelete = selectedSegmentId !== null && segments.length > 1

  return (
    <div className="flex flex-shrink-0 items-center justify-between border-b border-white/10 bg-slate-950/80 px-4 py-3 backdrop-blur-sm">
      {/* Gauche : retour + titre + actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onClose}
          disabled={generating || generatingDone}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/5 text-white transition-colors hover:bg-white/10 disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <h1 className="text-lg font-semibold text-white">Personnaliser le clip</h1>

        <div className="mx-2 h-5 w-px bg-white/10" />

        {/* Diviser */}
        <button
          onClick={() => dispatch({ type: 'SPLIT_AT_PLAYHEAD' })}
          disabled={!canSplit || generating || generatingDone}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
            canSplit && !generating && !generatingDone
              ? 'bg-white/10 text-white hover:bg-white/15'
              : 'bg-white/5 text-white/30 cursor-not-allowed'
          )}
        >
          <Scissors className="h-4 w-4" />
          Diviser
        </button>

        {/* Supprimer */}
        <button
          onClick={() => selectedSegmentId && dispatch({ type: 'DELETE_SEGMENT', id: selectedSegmentId })}
          disabled={!canDelete || generating || generatingDone}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
            canDelete && !generating && !generatingDone
              ? 'bg-white/10 text-red-400 hover:bg-red-500/20'
              : 'bg-white/5 text-white/30 cursor-not-allowed'
          )}
        >
          <Trash2 className="h-4 w-4" />
          Supprimer
        </button>
      </div>

      {/* Centre : info */}
      <div className="text-sm text-white/50">
        {segments.length} segment{segments.length > 1 ? 's' : ''} — {formatTime(totalDuration)}
      </div>

      {/* Droite : générer */}
      <button
        onClick={onGenerate}
        disabled={generating || disabled || generatingDone}
        className={cn(
          'flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all',
          generating || disabled || generatingDone
            ? 'bg-white/10 text-white/40 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25'
        )}
      >
        {generatingDone ? (
          <>
            <Check className="h-4 w-4" />
            Clip créé !
          </>
        ) : generating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {generatingLabel || 'Génération...'}
          </>
        ) : (
          <>
            <Wand2 className="h-4 w-4" />
            Générer le clip
          </>
        )}
      </button>
    </div>
  )
}
