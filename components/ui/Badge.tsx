import { cn } from '@/lib/utils'

type BadgeVariant = 'orange' | 'amber' | 'emerald' | 'yellow' | 'blue' | 'red' | 'default'

interface Props {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  orange: 'bg-orange-500/20 text-orange-300',
  amber: 'bg-amber-500/20 text-amber-300',
  emerald: 'bg-emerald-500/20 text-emerald-300',
  yellow: 'bg-yellow-500/20 text-yellow-300',
  blue: 'bg-blue-500/20 text-blue-300',
  red: 'bg-red-500/20 text-red-300',
  default: 'bg-white/10 text-white/50',
}

export function Badge({ children, variant = 'default', className }: Props) {
  return (
    <span className={cn('rounded-full px-3 py-0.5 text-xs font-medium', VARIANT_STYLES[variant], className)}>
      {children}
    </span>
  )
}
