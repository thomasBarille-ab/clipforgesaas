'use client'

import { cn } from '@/lib/utils'

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  icon?: React.ElementType
}

export function Input({ label, hint, icon: Icon, className, id, ...props }: Props) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-2 flex items-center gap-2 text-sm font-medium text-white/70">
          {Icon && <Icon className="h-4 w-4" />}
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          'w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-purple-500 focus:outline-none transition-colors',
          'disabled:opacity-50',
          className
        )}
        {...props}
      />
      {hint && <p className="mt-1.5 text-xs text-white/30">{hint}</p>}
    </div>
  )
}
