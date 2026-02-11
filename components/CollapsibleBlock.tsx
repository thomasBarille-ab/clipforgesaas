'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  title: string
  icon: React.ElementType
  defaultOpen?: boolean
  children: React.ReactNode
  badge?: React.ReactNode
}

export function CollapsibleBlock({ title, icon: Icon, defaultOpen = true, children, badge }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 p-5 text-left"
      >
        <Icon className="h-4 w-4 text-white/50" />
        <span className="text-sm font-semibold text-white">{title}</span>
        {badge && <span className="ml-auto mr-2">{badge}</span>}
        <ChevronDown
          className={cn(
            'h-4 w-4 text-white/40 transition-transform duration-200',
            !badge && 'ml-auto',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}
