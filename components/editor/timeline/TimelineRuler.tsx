'use client'

import { useMemo } from 'react'
import { formatTime } from '@/lib/utils'
import { useEditor } from '../EditorProvider'

export function TimelineRuler() {
  const { totalDuration, state } = useEditor()
  const { pixelsPerSecond } = state.zoom

  const ticks = useMemo(() => {
    // Déterminer l'intervalle entre les ticks selon le zoom
    let interval = 1
    if (pixelsPerSecond < 20) interval = 10
    else if (pixelsPerSecond < 40) interval = 5
    else if (pixelsPerSecond < 80) interval = 2
    else interval = 1

    const result: Array<{ time: number; label: string; major: boolean }> = []
    for (let t = 0; t <= totalDuration; t += interval) {
      result.push({
        time: t,
        label: formatTime(t),
        major: t % (interval * 2) === 0 || interval <= 1,
      })
    }
    return result
  }, [totalDuration, pixelsPerSecond])

  const width = totalDuration * pixelsPerSecond

  return (
    <div className="relative h-6 select-none" style={{ width }}>
      {ticks.map((tick) => (
        <div
          key={tick.time}
          className="absolute top-0 flex flex-col items-center"
          style={{ left: tick.time * pixelsPerSecond }}
        >
          <div
            className={tick.major ? 'h-3 w-px bg-white/30' : 'h-2 w-px bg-white/15'}
          />
          {tick.major && (
            <span className="mt-0.5 text-[10px] text-white/40 whitespace-nowrap">
              {tick.label}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
