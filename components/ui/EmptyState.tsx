import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Props {
  icon: React.ElementType
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
  actionIcon?: React.ElementType
  className?: string
}

export function EmptyState({ icon: Icon, title, description, actionLabel, actionHref, actionIcon: ActionIcon, className }: Props) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-16 text-center', className)}>
      <Icon className="mb-4 h-16 w-16 text-white/15" />
      <h2 className="mb-2 text-xl font-semibold text-white/60">{title}</h2>
      {description && <p className="mb-6 max-w-sm text-sm text-white/40">{description}</p>}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-semibold text-white transition-transform hover:scale-105"
        >
          {ActionIcon && <ActionIcon className="h-5 w-5" />}
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
