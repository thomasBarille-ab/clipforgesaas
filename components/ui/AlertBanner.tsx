'use client'

import { CircleAlert, CircleCheck, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type AlertVariant = 'error' | 'success' | 'info'

interface Props {
  variant?: AlertVariant
  message: string
  className?: string
}

const VARIANTS: Record<AlertVariant, { border: string; bg: string; text: string; icon: React.ElementType }> = {
  error: {
    border: 'border-red-500/20',
    bg: 'bg-red-500/10',
    text: 'text-red-300',
    icon: CircleAlert,
  },
  success: {
    border: 'border-emerald-500/20',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-300',
    icon: CircleCheck,
  },
  info: {
    border: 'border-blue-500/20',
    bg: 'bg-blue-500/10',
    text: 'text-blue-300',
    icon: Info,
  },
}

export function AlertBanner({ variant = 'error', message, className }: Props) {
  const config = VARIANTS[variant]
  const Icon = config.icon

  return (
    <div className={cn('flex items-center gap-3 rounded-xl border px-4 py-3', config.border, config.bg, className)}>
      <Icon className={cn('h-5 w-5 shrink-0', config.text)} />
      <p className={cn('text-sm', config.text)}>{message}</p>
    </div>
  )
}
