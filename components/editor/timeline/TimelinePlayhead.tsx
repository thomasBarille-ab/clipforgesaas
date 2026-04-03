'use client'

import { useCallback } from 'react'
import { useEditor } from '../EditorProvider'
import { useTimelineDrag } from '@/hooks/useTimelineDrag'

function formatTimeTenths(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const tenths = Math.floor((seconds % 1) * 10)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${tenths}`
}

export function TimelinePlayhead() {
  const { state, dispatch, totalDuration } = useEditor()
  const { playheadTime, zoom } = state
  const left = playheadTime * zoom.pixelsPerSecond

  const drag = useTimelineDrag({
    onDrag: useCallback(
      (deltaX: number) => {
        const deltaTime = deltaX / zoom.pixelsPerSecond
        const newTime = Math.max(0, Math.min(totalDuration, playheadTime + deltaTime))
        dispatch({ type: 'SET_PLAYHEAD', time: newTime })
      },
      [zoom.pixelsPerSecond, totalDuration, playheadTime, dispatch]
    ),
    onDragEnd: useCallback(() => {
      // On pourrait reprendre la lecture ici si elle était en cours
    }, []),
  })

  return (
    <div
      className="absolute top-0 bottom-0 z-20 pointer-events-none"
      style={{ left }}
    >
      {/* Timecode au-dessus de la flèche */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-0.5 whitespace-nowrap rounded bg-white/90 px-1 py-px text-[10px] font-medium text-slate-900 tabular-nums shadow-sm">
        {formatTimeTenths(playheadTime)}
      </div>
      {/* Triangle en haut (draggable) */}
      <div
        className="pointer-events-auto -ml-2 cursor-grab active:cursor-grabbing"
        onMouseDown={drag.onMouseDown}
      >
        <svg width="16" height="10" viewBox="0 0 16 10" className="fill-white drop-shadow-md">
          <path d="M0 0 L16 0 L8 10 Z" />
        </svg>
      </div>
      {/* Ligne verticale — centrée sur la pointe du triangle */}
      <div className="absolute left-[-1px] top-[10px] bottom-0 w-[2px] bg-white shadow-sm shadow-white/30" />
    </div>
  )
}
