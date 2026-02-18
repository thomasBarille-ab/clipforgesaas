/** Segment contigu sur la timeline */
export interface TimelineSegment {
  id: string
  sourceStart: number   // temps absolu début dans la vidéo source
  sourceEnd: number     // temps absolu fin dans la vidéo source
  cropX: number         // position du crop 9:16 (0=gauche, 0.5=centre, 1=droite)
}

/** Zoom de la timeline */
export interface TimelineZoom {
  pixelsPerSecond: number   // plus grand = plus zoomé
  scrollLeft: number        // offset de scroll horizontal
}

/** Position calculée d'un segment sur la timeline */
export interface SegmentOffset {
  id: string
  timelineStart: number
  timelineEnd: number
}

/** Résultat de la conversion timeline → source */
export interface TimelineToSourceResult {
  segmentId: string
  sourceTime: number
}

/** État complet de l'éditeur */
export interface EditorState {
  segments: TimelineSegment[]
  selectedSegmentId: string | null
  playheadTime: number        // position sur la timeline (pas le temps source)
  playing: boolean
  zoom: TimelineZoom
}

/** Actions du reducer */
export type EditorAction =
  | { type: 'SET_SEGMENTS'; segments: TimelineSegment[] }
  | { type: 'UPDATE_SEGMENT'; id: string; updates: Partial<TimelineSegment> }
  | { type: 'SELECT_SEGMENT'; id: string | null }
  | { type: 'SPLIT_AT_PLAYHEAD' }
  | { type: 'DELETE_SEGMENT'; id: string }
  | { type: 'SET_PLAYHEAD'; time: number }
  | { type: 'SET_PLAYING'; playing: boolean }
  | { type: 'SET_ZOOM'; zoom: Partial<TimelineZoom> }
  | { type: 'TRIM_SEGMENT_START'; id: string; newSourceStart: number }
  | { type: 'TRIM_SEGMENT_END'; id: string; newSourceEnd: number }
