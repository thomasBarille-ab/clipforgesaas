'use client'

import Link from 'next/link'
import { UserCircle } from 'lucide-react'
import { NotificationDropdown } from '@/components/NotificationDropdown'

export function DashboardHeader() {
  return (
    <div className="flex items-center gap-3">
      <NotificationDropdown />
      <Link
        href="/settings"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-600/20 transition-transform hover:scale-105"
      >
        <UserCircle className="h-5 w-5" />
      </Link>
    </div>
  )
}
