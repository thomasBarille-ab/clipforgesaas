'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Film,
  Scissors,
  Upload,
  Settings,
  LogOut,
  Loader2,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

const NAV_ITEMS = [
  { href: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { href: '/videos', labelKey: 'nav.videos', icon: Film },
  { href: '/clips', labelKey: 'nav.clips', icon: Scissors },
  { href: '/upload', labelKey: 'nav.upload', icon: Upload },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)
  const { t } = useTranslation()

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-56 flex-col border-r border-white/5 bg-slate-950/80 backdrop-blur-xl md:flex">
        {/* Logo */}
        <div className="flex h-16 items-center px-5">
          <Link href="/dashboard" className="text-xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Clip
            </span>
            <span className="text-white">Forge</span>
          </Link>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
            const label = t(labelKey)
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-purple-500/15 text-white'
                    : 'text-white/45 hover:bg-white/5 hover:text-white/80'
                )}
              >
                <Icon className={cn('h-[18px] w-[18px]', isActive && 'text-purple-400')} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="space-y-1 border-t border-white/5 px-3 py-4">
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
              pathname === '/settings'
                ? 'bg-purple-500/15 text-white'
                : 'text-white/45 hover:bg-white/5 hover:text-white/80'
            )}
          >
            <Settings className={cn('h-[18px] w-[18px]', pathname === '/settings' && 'text-purple-400')} />
            {t('nav.settings')}
          </Link>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/45 transition-all hover:bg-white/5 hover:text-white/80 disabled:opacity-50"
          >
            {signingOut ? (
              <Loader2 className="h-[18px] w-[18px] animate-spin" />
            ) : (
              <LogOut className="h-[18px] w-[18px]" />
            )}
            {t('nav.signOut')}
          </button>
          <LanguageSwitcher />
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="fixed bottom-0 left-0 z-40 flex w-full border-t border-white/5 bg-slate-950/90 backdrop-blur-xl md:hidden">
        {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
          const label = t(labelKey)
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          const isUpload = href === '/upload'
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
                isUpload
                  ? 'text-purple-400'
                  : isActive
                    ? 'text-white'
                    : 'text-white/35'
              )}
            >
              {isUpload ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600">
                  <Icon className="h-4 w-4 text-white" />
                </div>
              ) : (
                <Icon className={cn('h-5 w-5', isActive && 'text-purple-400')} />
              )}
              {!isUpload && label}
            </Link>
          )
        })}
        <Link
          href="/settings"
          className={cn(
            'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
            pathname === '/settings' ? 'text-white' : 'text-white/35'
          )}
        >
          <Settings className={cn('h-5 w-5', pathname === '/settings' && 'text-purple-400')} />
          {t('nav.settings')}
        </Link>
      </nav>
    </>
  )
}
