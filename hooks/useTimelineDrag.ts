'use client'

import { useRef, useCallback, useState } from 'react'

interface UseTimelineDragOptions {
  onDrag: (deltaX: number) => void
  onDragEnd?: () => void
}

export function useTimelineDrag({ onDrag, onDragEnd }: UseTimelineDragOptions) {
  const draggingRef = useRef(false)
  const startX = useRef(0)
  const [isDragging, setIsDragging] = useState(false)

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      draggingRef.current = true
      setIsDragging(true)
      startX.current = e.clientX

      const handleMove = (ev: MouseEvent) => {
        if (!draggingRef.current) return
        const delta = ev.clientX - startX.current
        startX.current = ev.clientX
        onDrag(delta)
      }

      const handleUp = () => {
        draggingRef.current = false
        setIsDragging(false)
        window.removeEventListener('mousemove', handleMove)
        window.removeEventListener('mouseup', handleUp)
        onDragEnd?.()
      }

      window.addEventListener('mousemove', handleMove)
      window.addEventListener('mouseup', handleUp)
    },
    [onDrag, onDragEnd]
  )

  return { onMouseDown, isDragging }
}
