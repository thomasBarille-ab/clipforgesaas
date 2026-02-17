'use client'

import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { useEditor } from '../EditorProvider'
import { formatTime } from '@/lib/utils'

interface TimelineControlsProps {
  containerWidth: number
}

export function TimelineControls({ containerWidth }: TimelineControlsProps) {
  const { state, dispatch, totalDuration } = useEditor()
  const { pixelsPerSecond } = state.zoom

  function zoomIn() {
    dispatch({ type: 'SET_ZOOM', zoom: { pixelsPerSecond: Math.min(200, pixelsPerSecond * 1.5) } })
  }

  function zoomOut() {
    dispatch({ type: 'SET_ZOOM', zoom: { pixelsPerSecond: Math.max(10, pixelsPerSecond / 1.5) } })
  }

  function fitToView() {
    if (totalDuration > 0 && containerWidth > 0) {
      const pps = Math.max(10, Math.min(200, (containerWidth - 40) / totalDuration))
      dispatch({ type: 'SET_ZOOM', zoom: { pixelsPerSecond: pps } })
    }
  }

  return (
    <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-950/60 px-4 py-2">
      <div className="flex items-center gap-2">
        <button
          onClick={zoomOut}
          className="flex h-7 w-7 items-center justify-center rounded-md bg-white/5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <div className="w-16 text-center text-xs text-white/40">
          {Math.round(pixelsPerSecond)} px/s
        </div>
        <button
          onClick={zoomIn}
          className="flex h-7 w-7 items-center justify-center rounded-md bg-white/5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={fitToView}
          className="flex h-7 items-center gap-1 rounded-md bg-white/5 px-2 text-xs text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Maximize2 className="h-3 w-3" />
          Fit
        </button>
      </div>

      <div className="text-xs text-white/40">
        Durée totale : {formatTime(totalDuration)}
      </div>
    </div>
  )
}
