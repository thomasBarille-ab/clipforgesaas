'use client'

import { cn } from '@/lib/utils'
import type { BrandingConfig } from '@/types/database'

interface BrandingOverlayPreviewProps {
  config: BrandingConfig
  logoUrl: string | null
  scale?: number
}

const POSITION_CLASSES: Record<BrandingConfig['position'], string> = {
  'top-left': 'top-[3%] left-[5%]',
  'top-right': 'top-[3%] right-[5%]',
  'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  'bottom-left': 'bottom-[3%] left-[5%]',
  'bottom-right': 'bottom-[3%] right-[5%]',
}

export function BrandingOverlayPreview({ config, logoUrl, scale = 1 }: BrandingOverlayPreviewProps) {
  if (!config.enabled) return null
  if (!config.showLogo && !config.showText) return null

  const fontSize = Math.max(8, 14 * scale)

  return (
    <div
      className={cn('absolute pointer-events-none z-10 flex items-center gap-1.5', POSITION_CLASSES[config.position])}
      style={{ opacity: config.textOpacity }}
    >
      {config.showLogo && logoUrl && (
        <img
          src={logoUrl}
          alt=""
          className="object-contain"
          style={{
            height: `${Math.max(12, 32 * scale)}px`,
            maxWidth: `${Math.max(24, 60 * scale)}px`,
          }}
        />
      )}
      {config.showText && config.text && (
        <span
          className="font-bold whitespace-nowrap"
          style={{
            color: config.textColor,
            fontSize: `${fontSize}px`,
          }}
        >
          {config.text}
        </span>
      )}
    </div>
  )
}
