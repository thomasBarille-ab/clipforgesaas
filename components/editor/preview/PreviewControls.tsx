'use client'

import { Play, Pause, RotateCcw } from 'lucide-react'
import { useEditor } from '../EditorProvider'
import { formatTime } from '@/lib/utils'

export function PreviewControls() {
  const { state, dispatch, totalDuration } = useEditor()
  const { playing, playheadTime } = state

  return (
    <div className="flex items-center justify-center gap-4 py-3">
      {/* Restart */}
      <button
        onClick={() => {
          dispatch({ type: 'SET_PLAYHEAD', time: 0 })
          dispatch({ type: 'SET_PLAYING', playing: false })
        }}
        className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
      >
        <RotateCcw className="h-4 w-4" />
      </button>

      {/* Play/Pause */}
      <button
        onClick={() => dispatch({ type: 'SET_PLAYING', playing: !playing })}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 hover:scale-105"
      >
        {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
      </button>

      {/* Time display */}
      <div className="min-w-[100px] text-center text-sm text-white/60 tabular-nums">
        {formatTime(playheadTime)} / {formatTime(totalDuration)}
      </div>
    </div>
  )
}
