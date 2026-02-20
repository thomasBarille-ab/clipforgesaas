'use client'

import { useTranslation } from 'react-i18next'
import { Clock, TrendingUp, Plus, Check } from 'lucide-react'
import { cn, formatTime } from '@/lib/utils'
import { Badge, Button } from '@/components/ui'
import type { ClipSuggestion } from '@/types/database'

interface Props {
  suggestion: ClipSuggestion
  isCreated: boolean
  onSelect: () => void
  variant?: 'default' | 'search'
}

export function SuggestionCard({ suggestion, isCreated, onSelect, variant = 'default' }: Props) {
  const { t } = useTranslation()
  const isSearch = variant === 'search'
  const accentColor = isSearch ? 'pink' : 'purple'

  return (
    <div
      className={cn(
        'group rounded-xl border bg-white/5 p-6 transition-all duration-200',
        isCreated
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : isSearch
            ? 'border-pink-500/20 hover:border-pink-500/40 hover:bg-white/[0.07]'
            : 'border-white/10 hover:border-purple-500/50 hover:bg-white/[0.07]'
      )}
    >
      {isSearch && (
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="pink" className="px-2 py-0.5 text-[10px]">
            {t('createClips.searchBadge')}
          </Badge>
        </div>
      )}

      <h3 className="mb-2 text-lg font-bold text-white">{suggestion.title}</h3>

      {suggestion.description && (
        <p className="mb-3 text-sm leading-relaxed text-white/60">{suggestion.description}</p>
      )}

      {suggestion.hashtags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {suggestion.hashtags.map((tag) => (
            <Badge key={tag} variant={accentColor === 'pink' ? 'pink' : 'purple'} className="px-3 py-1 text-xs">
              #{tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm text-white/40">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatTime(suggestion.start)} → {formatTime(suggestion.end)}
          </span>
          {suggestion.score > 0 && (
            <span className={cn('flex items-center gap-1 font-bold', isSearch ? 'text-pink-400' : 'text-purple-400')}>
              <TrendingUp className="h-3.5 w-3.5" />
              {suggestion.score.toFixed(1)}
            </span>
          )}
        </div>

        {isCreated ? (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
            <Check className="h-4 w-4" />
            {t('createClips.created')}
          </span>
        ) : (
          <Button onClick={onSelect} icon={Plus} size="sm">
            {t('createClips.create')}
          </Button>
        )}
      </div>
    </div>
  )
}
