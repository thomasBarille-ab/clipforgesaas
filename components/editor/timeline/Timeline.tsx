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

  // Auto-fit : ajuster le zoom pour que la timeline remplisse le container
  useEffect(() => {
    if (totalDuration > 0 && containerWidth > 0) {
      const padding = 32 // px-4 * 2
      const fitPps = (containerWidth - padding) / totalDuration
      dispatch({ type: 'SET_ZOOM', zoom: { pixelsPerSecond: Math.max(10, fitPps) } })
    }
  }, [containerWidth, totalDuration, dispatch])

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
    <div className="flex h-full flex-col">
      {/* Zone timeline */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-hidden px-4 py-2"
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

          {/* Controls dans le flow de la timeline */}
          <TimelineControls containerWidth={containerWidth} />
        </div>
      </div>
    </div>
  )
}
