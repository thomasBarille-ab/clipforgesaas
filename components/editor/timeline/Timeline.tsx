'use client'

import { useRef, useCallback, useState, useEffect } from 'react'
import { useEditor } from '../EditorProvider'
import { TimelineRuler } from './TimelineRuler'
import { TimelineSegment } from './TimelineSegment'
import { TimelinePlayhead } from './TimelinePlayhead'
import { TimelineControls } from './TimelineControls'

interface TimelineProps {
  videoUrl: string | null
}

export function Timeline({ videoUrl }: TimelineProps) {
  const { state, dispatch, totalDuration, segmentOffsets } = useEditor()
  const { pixelsPerSecond } = state.zoom
  const scrollRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  // Refs pour accès stable dans le wheel handler
  const ppsRef = useRef(pixelsPerSecond)
  ppsRef.current = pixelsPerSecond

  const contentWidth = totalDuration * pixelsPerSecond

  // Mesurer la largeur du container
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Ctrl+Wheel pour zoom — addEventListener non-passif pour pouvoir preventDefault
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const factor = e.deltaY < 0 ? 1.2 : 1 / 1.2
        const newPps = Math.max(10, Math.min(200, ppsRef.current * factor))
        dispatch({ type: 'SET_ZOOM', zoom: { pixelsPerSecond: newPps } })
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [dispatch])

  // Clic sur la timeline → déplacer le playhead + sélectionner le segment
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const scrollEl = scrollRef.current
      if (!scrollEl) return

      const rect = scrollEl.getBoundingClientRect()
      const x = e.clientX - rect.left + scrollEl.scrollLeft
      const time = Math.max(0, Math.min(totalDuration, x / pixelsPerSecond))
      dispatch({ type: 'SET_PLAYHEAD', time })

      // Sélectionner le segment sous le clic
      for (let i = 0; i < segmentOffsets.length; i++) {
        const off = segmentOffsets[i]
        if (time >= off.timelineStart && time <= off.timelineEnd) {
          dispatch({ type: 'SELECT_SEGMENT', id: state.segments[i].id })
          break
        }
      }
    },
    [totalDuration, pixelsPerSecond, dispatch, segmentOffsets, state.segments]
  )

  return (
    <div className="flex flex-shrink-0 flex-col border-t border-white/10 bg-slate-900/50">
      {/* Zone scrollable */}
      <div
        ref={scrollRef}
        className="overflow-x-auto overflow-y-hidden px-4 py-2"
        style={{ maxHeight: 120 }}
        onClick={handleClick}
      >
        <div className="relative" style={{ width: contentWidth, minWidth: '100%' }}>
          {/* Ruler */}
          <TimelineRuler />

          {/* Lane de segments */}
          <div className="relative mt-1" style={{ height: 52 }}>
            {state.segments.map((seg, i) => (
              <div key={seg.id} data-segment>
                <TimelineSegment
                  segment={seg}
                  timelineStart={segmentOffsets[i]?.timelineStart ?? 0}
                  videoUrl={videoUrl}
                />
              </div>
            ))}

            {/* Playhead */}
            <TimelinePlayhead />
          </div>
        </div>
      </div>

      {/* Controls */}
      <TimelineControls containerWidth={containerWidth} />
    </div>
  )
}
