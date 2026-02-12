'use client'

import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
  showCloseButton?: boolean
}

export function Modal({ open, onClose, children, className, showCloseButton = false }: Props) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={cn('relative w-full max-w-md overflow-hidden rounded-2xl border border-white/20 bg-slate-900', className)}
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-2 text-white/70 transition-colors hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        {children}
      </div>
    </div>
  )
}
