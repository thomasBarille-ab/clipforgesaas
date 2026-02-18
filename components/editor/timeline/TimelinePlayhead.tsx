'use client'

import { useCallback } from 'react'
import { useEditor } from '../EditorProvider'
import { useTimelineDrag } from '@/hooks/useTimelineDrag'

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
      {/* Triangle en haut (draggable) */}
      <div
        className="pointer-events-auto -ml-2 cursor-grab active:cursor-grabbing"
        onMouseDown={drag.onMouseDown}
      >
        <svg width="16" height="10" viewBox="0 0 16 10" className="fill-white drop-shadow-md">
          <path d="M0 0 L16 0 L8 10 Z" />
        </svg>
      </div>
      {/* Ligne verticale */}
      <div className="absolute left-[7px] top-[10px] bottom-0 w-[2px] bg-white shadow-sm shadow-white/30" />
    </div>
  )
}
