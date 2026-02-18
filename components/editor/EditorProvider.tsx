'use client'

import { createContext, useContext, useReducer, useMemo, type ReactNode } from 'react'
import type {
  EditorState,
  EditorAction,
  TimelineSegment,
  SegmentOffset,
  TimelineToSourceResult,
} from './types'

const MIN_SEGMENT_DURATION = 1 // secondes

function computeSegmentOffsets(segments: TimelineSegment[]): SegmentOffset[] {
  const offsets: SegmentOffset[] = []
  let cursor = 0
  for (const seg of segments) {
    const dur = seg.sourceEnd - seg.sourceStart
    offsets.push({ id: seg.id, timelineStart: cursor, timelineEnd: cursor + dur })
    cursor += dur
  }
  return offsets
}

function timelineToSource(
  time: number,
  segments: TimelineSegment[],
  offsets: SegmentOffset[]
): TimelineToSourceResult | null {
  for (let i = 0; i < segments.length; i++) {
    const off = offsets[i]
    if (time >= off.timelineStart && time <= off.timelineEnd) {
      const relativeTime = time - off.timelineStart
      return { segmentId: segments[i].id, sourceTime: segments[i].sourceStart + relativeTime }
    }
  }
  // Hors limites — retourner le dernier segment
  if (segments.length > 0) {
    const last = segments[segments.length - 1]
    return { segmentId: last.id, sourceTime: last.sourceEnd }
  }
  return null
}

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_SEGMENTS':
      return { ...state, segments: action.segments, selectedSegmentId: null, playheadTime: 0 }

    case 'UPDATE_SEGMENT':
      return {
        ...state,
        segments: state.segments.map((s) =>
          s.id === action.id ? { ...s, ...action.updates } : s
        ),
      }

    case 'SELECT_SEGMENT':
      return { ...state, selectedSegmentId: action.id }

    case 'SET_PLAYHEAD':
      return { ...state, playheadTime: action.time }

    case 'SET_PLAYING':
      return { ...state, playing: action.playing }

    case 'SET_ZOOM':
      return { ...state, zoom: { ...state.zoom, ...action.zoom } }

    case 'TRIM_SEGMENT_START': {
      return {
        ...state,
        segments: state.segments.map((s) => {
          if (s.id !== action.id) return s
          const newStart = Math.max(action.newSourceStart, 0)
          if (s.sourceEnd - newStart < MIN_SEGMENT_DURATION) return s
          return { ...s, sourceStart: newStart }
        }),
      }
    }

    case 'TRIM_SEGMENT_END': {
      return {
        ...state,
        segments: state.segments.map((s) => {
          if (s.id !== action.id) return s
          const newEnd = Math.max(action.newSourceEnd, s.sourceStart + MIN_SEGMENT_DURATION)
          return { ...s, sourceEnd: newEnd }
        }),
      }
    }

    case 'SPLIT_AT_PLAYHEAD': {
      const offsets = computeSegmentOffsets(state.segments)
      const result = timelineToSource(state.playheadTime, state.segments, offsets)
      if (!result) return state

      const segIdx = state.segments.findIndex((s) => s.id === result.segmentId)
      if (segIdx === -1) return state

      const seg = state.segments[segIdx]
      const splitTime = result.sourceTime

      // Vérifier que chaque moitié fait au moins MIN_SEGMENT_DURATION
      if (splitTime - seg.sourceStart < MIN_SEGMENT_DURATION) return state
      if (seg.sourceEnd - splitTime < MIN_SEGMENT_DURATION) return state

      const seg1: TimelineSegment = {
        id: seg.id,
        sourceStart: seg.sourceStart,
        sourceEnd: splitTime,
        cropX: seg.cropX,
      }
      const seg2: TimelineSegment = {
        id: crypto.randomUUID(),
        sourceStart: splitTime,
        sourceEnd: seg.sourceEnd,
        cropX: seg.cropX,
      }

      const newSegments = [...state.segments]
      newSegments.splice(segIdx, 1, seg1, seg2)

      return { ...state, segments: newSegments, selectedSegmentId: seg2.id }
    }

    case 'DELETE_SEGMENT': {
      if (state.segments.length <= 1) return state
      const newSegments = state.segments.filter((s) => s.id !== action.id)
      const offsets = computeSegmentOffsets(newSegments)
      const totalDuration = offsets.length > 0 ? offsets[offsets.length - 1].timelineEnd : 0
      return {
        ...state,
        segments: newSegments,
        selectedSegmentId:
          state.selectedSegmentId === action.id ? null : state.selectedSegmentId,
        playheadTime: Math.min(state.playheadTime, totalDuration),
      }
    }

    default:
      return state
  }
}

interface EditorContextValue {
  state: EditorState
  dispatch: React.Dispatch<EditorAction>
  totalDuration: number
  segmentOffsets: SegmentOffset[]
  timelineToSource: (time: number) => TimelineToSourceResult | null
}

const EditorContext = createContext<EditorContextValue | null>(null)

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext)
  if (!ctx) throw new Error('useEditor must be used within EditorProvider')
  return ctx
}

interface EditorProviderProps {
  initialSegments: TimelineSegment[]
  children: ReactNode
}

export function EditorProvider({ initialSegments, children }: EditorProviderProps) {
  const [state, dispatch] = useReducer(editorReducer, {
    segments: initialSegments,
    selectedSegmentId: initialSegments[0]?.id ?? null,
    playheadTime: 0,
    playing: false,
    zoom: { pixelsPerSecond: 60, scrollLeft: 0 },
  })

  const segmentOffsets = useMemo(() => computeSegmentOffsets(state.segments), [state.segments])

  const totalDuration = useMemo(
    () => (segmentOffsets.length > 0 ? segmentOffsets[segmentOffsets.length - 1].timelineEnd : 0),
    [segmentOffsets]
  )

  const timelineToSourceFn = useMemo(
    () => (time: number) => timelineToSource(time, state.segments, segmentOffsets),
    [state.segments, segmentOffsets]
  )

  const value = useMemo<EditorContextValue>(
    () => ({
      state,
      dispatch,
      totalDuration,
      segmentOffsets,
      timelineToSource: timelineToSourceFn,
    }),
    [state, dispatch, totalDuration, segmentOffsets, timelineToSourceFn]
  )

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
}
