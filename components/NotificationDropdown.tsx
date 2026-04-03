'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  Bell,
  Scissors,
  Crown,
  AlertTriangle,
  CreditCard,
  Clock,
  Check,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Notification, NotificationType } from '@/types/database'

const ICON_CONFIG: Record<NotificationType, { icon: React.ElementType; color: string; bg: string }> = {
  clip_ready: { icon: Scissors, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  subscription_started: { icon: Crown, color: 'text-orange-400', bg: 'bg-orange-500/20' },
  subscription_changed: { icon: Crown, color: 'text-orange-400', bg: 'bg-orange-500/20' },
  subscription_canceled: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/20' },
  invoice_paid: { icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  payment_failed: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/20' },
  expiry_warning: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/20' },
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60_000)
  const diffH = Math.floor(diffMs / 3_600_000)
  const diffD = Math.floor(diffMs / 86_400_000)

  if (diffMin < 1) return 'à l\'instant'
  if (diffMin < 60) return `il y a ${diffMin} min`
  if (diffH < 24) return `il y a ${diffH}h`
  return `il y a ${diffD}j`
}

export function NotificationDropdown() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const hasOpenedRef = useRef(false)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications ?? [])
        setUnreadCount(data.unreadCount ?? 0)
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch on mount
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Poll every 60s
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 60_000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        if (open) {
          closeDropdown()
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, unreadCount])

  function updatePosition() {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    setDropdownPos({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    })
  }

  async function markAllRead() {
    try {
      const res = await fetch('/api/notifications/read-all', { method: 'POST' })
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    } catch {
      // silent fail
    }
  }

  function closeDropdown() {
    setOpen(false)
    // Auto-mark as read on close if there were unread notifications
    if (hasOpenedRef.current && unreadCount > 0) {
      markAllRead()
    }
    hasOpenedRef.current = false
  }

  function toggleDropdown() {
    if (open) {
      closeDropdown()
    } else {
      updatePosition()
      setOpen(true)
      hasOpenedRef.current = true
      fetchNotifications()
    }
  }

  return (
    <>
      {/* Bell button */}
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-600/20 transition-transform hover:scale-105"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown — rendered via portal in document.body */}
      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          className="fixed w-80 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur-xl sm:w-96"
          style={{ top: dropdownPos.top, right: dropdownPos.right, zIndex: 9999 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h3 className="text-sm font-semibold text-white">{t('notifications.title')}</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-white/50 transition-colors hover:bg-white/10 hover:text-white/80"
                >
                  <Check className="h-3 w-3" />
                  {t('notifications.markAllRead')}
                </button>
              )}
              <button
                onClick={closeDropdown}
                className="rounded-lg p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-orange-400" />
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="px-4 py-8 text-center">
                <Bell className="mx-auto mb-2 h-8 w-8 text-white/20" />
                <p className="text-sm font-medium text-white/40">{t('notifications.empty')}</p>
                <p className="mt-1 text-xs text-white/25">{t('notifications.emptyDesc')}</p>
              </div>
            )}

            {notifications.map((notification) => {
              const config = ICON_CONFIG[notification.type] ?? ICON_CONFIG.clip_ready
              const Icon = config.icon

              return (
                <div
                  key={notification.id}
                  className={`flex gap-3 border-b border-white/5 px-4 py-3 transition-colors last:border-0 ${
                    notification.read ? 'opacity-60' : 'bg-white/[0.03]'
                  }`}
                >
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.bg}`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-white">{notification.title}</p>
                      {!notification.read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-orange-500" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-white/50">{notification.message}</p>
                    <p className="mt-1 text-[10px] text-white/30">{formatRelativeTime(notification.created_at)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
