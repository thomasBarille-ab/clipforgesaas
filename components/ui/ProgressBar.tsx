'use client'

import { cn } from '@/lib/utils'

interface Props {
  progress: number
  label?: string
  sublabel?: string
  icon?: React.ReactNode
  className?: string
}

export function ProgressBar({ progress, label, sublabel, icon, className }: Props) {
  return (
    <div className={cn('rounded-xl border border-purple-500/30 bg-purple-500/10 p-4', className)}>
      {(label || sublabel) && (
        <div className="mb-2 flex items-center justify-between">
          {label && (
            <span className="flex items-center gap-2 text-sm font-medium text-purple-300">
              {icon}
              {label}
            </span>
          )}
          {sublabel && <span className="text-sm text-purple-400">{sublabel}</span>}
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  )
}
