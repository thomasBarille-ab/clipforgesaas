'use client'

import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export function BackButton() {
  const pathname = usePathname()
  const router = useRouter()

  if (pathname === '/dashboard') return null

  return (
    <button
      onClick={() => router.back()}
      className="mb-4 flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" />
      Retour
    </button>
  )
}
