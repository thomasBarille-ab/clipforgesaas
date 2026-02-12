'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ElementType
  children: React.ReactNode
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25',
  secondary: 'border border-white/20 bg-white/5 text-white hover:bg-white/10',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'text-white/50 hover:bg-white/10 hover:text-white',
}

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-sm gap-1.5',
  md: 'px-5 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  children,
  className,
  disabled,
  ...props
}: Props) {
  return (
    <button
      className={cn(
        'flex items-center justify-center rounded-xl font-semibold transition-all',
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        (disabled || loading) && 'opacity-50 cursor-not-allowed hover:scale-100',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : Icon ? (
        <Icon className="h-5 w-5" />
      ) : null}
      {children}
    </button>
  )
}
