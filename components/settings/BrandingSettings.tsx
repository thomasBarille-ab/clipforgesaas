'use client'

import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, Type, Upload, Trash2, Save, Loader2, Palette } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button, Modal } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { BrandingConfig, BrandingPosition } from '@/types/database'

const POSITIONS: { value: BrandingPosition; gridArea: string }[] = [
  { value: 'top-left', gridArea: '1 / 1' },
  { value: 'top-right', gridArea: '1 / 3' },
  { value: 'center', gridArea: '2 / 2' },
  { value: 'bottom-left', gridArea: '3 / 1' },
  { value: 'bottom-right', gridArea: '3 / 3' },
]

const POSITION_LABEL_KEYS: Record<BrandingPosition, string> = {
  'center': 'settings.branding.positionCenter',
  'bottom-right': 'settings.branding.positionBottomRight',
  'bottom-left': 'settings.branding.positionBottomLeft',
  'top-right': 'settings.branding.positionTopRight',
  'top-left': 'settings.branding.positionTopLeft',
}

interface BrandingSettingsProps {
  open: boolean
  onClose: () => void
  initialConfig: BrandingConfig | null
  logoSignedUrl: string | null
  userId: string
  onSaved: () => void
}

export function BrandingSettings({ open, onClose, initialConfig, logoSignedUrl, userId, onSaved }: BrandingSettingsProps) {
  const { t } = useTranslation()

  const [config, setConfig] = useState<BrandingConfig>(
    initialConfig ?? {
      enabled: false,
      text: '',
      logoPath: null,
      position: 'bottom-right',
      showLogo: false,
      showText: true,
      textColor: '#FFFFFF',
      textOpacity: 0.7,
    }
  )

  const [logoPreview, setLogoPreview] = useState<string | null>(logoSignedUrl)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateConfig = useCallback(<K extends keyof BrandingConfig>(key: K, value: BrandingConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }, [])

  function handleLogoSelect(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      setError(t('settings.branding.logoUploadError'))
      return
    }
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setError(t('settings.branding.logoUploadError'))
      return
    }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
    updateConfig('showLogo', true)
    setError(null)
  }

  function handleRemoveLogo() {
    setLogoFile(null)
    setLogoPreview(null)
    updateConfig('logoPath', null)
    updateConfig('showLogo', false)
  }

  async function handleSave() {
    if (saving) return
    setSaving(true)
    setError(null)

    try {
      const supabase = createClient()
      let logoPath = config.logoPath

      // Upload logo if new file selected
      if (logoFile) {
        const ext = logoFile.type === 'image/png' ? 'png' : 'jpg'
        const storagePath = `${userId}/branding/logo.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(storagePath, logoFile, {
            contentType: logoFile.type,
            upsert: true,
          })

        if (uploadError) {
          setError(t('settings.branding.logoUploadError'))
          setSaving(false)
          return
        }

        logoPath = storagePath
      }

      const finalConfig: BrandingConfig = { ...config, logoPath }

      const res = await fetch('/api/account/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalConfig),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? t('settings.branding.saveError'))
        setSaving(false)
        return
      }

      setLogoFile(null)
      onSaved()
      onClose()
    } catch {
      setError(t('settings.branding.saveError'))
    } finally {
      setSaving(false)
    }
  }

  // Position picker styles for a 9:16 mini preview
  const positionStyles: Record<BrandingPosition, string> = {
    'top-left': 'top-3 left-3',
    'top-right': 'top-3 right-3',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    'bottom-left': 'bottom-3 left-3',
    'bottom-right': 'bottom-3 right-3',
  }

  return (
    <Modal open={open} onClose={onClose} showCloseButton className="max-w-lg">
      <div className="max-h-[80vh] overflow-y-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Palette className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">{t('settings.branding.title')}</h2>
          </div>
          <p className="text-sm text-white/40">{t('settings.branding.subtitle')}</p>
        </div>

        {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Master toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white/70">{t('settings.branding.enabled')}</span>
        <button
          onClick={() => updateConfig('enabled', !config.enabled)}
          className={cn(
            'relative h-6 w-11 rounded-full transition-colors',
            config.enabled ? 'bg-orange-500' : 'bg-white/20'
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform',
              config.enabled && 'translate-x-5'
            )}
          />
        </button>
      </div>

      {config.enabled && (
        <>
          {/* Logo upload */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/50 flex items-center gap-1.5">
              <Image className="h-3.5 w-3.5" />
              {t('settings.branding.logo')}
            </label>
            <p className="text-xs text-white/30">{t('settings.branding.logoHint')}</p>

            {logoPreview ? (
              <div className="flex items-center gap-3">
                <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                  <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
                </div>
                <button
                  onClick={handleRemoveLogo}
                  className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t('settings.branding.logoRemove')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const file = e.dataTransfer.files[0]
                  if (file) handleLogoSelect(file)
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-xs text-white/40 transition-colors hover:border-white/20 hover:bg-white/5"
              >
                <Upload className="h-4 w-4" />
                {t('settings.branding.logoUpload')}
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleLogoSelect(file)
                e.target.value = ''
              }}
            />
          </div>

          {/* Text input */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/50 flex items-center gap-1.5">
              <Type className="h-3.5 w-3.5" />
              {t('settings.branding.text')}
            </label>
            <input
              type="text"
              value={config.text}
              onChange={(e) => updateConfig('text', e.target.value.slice(0, 100))}
              placeholder={t('settings.branding.textPlaceholder')}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-orange-500 focus:outline-none transition-colors"
            />
            <p className="text-xs text-white/30">{t('settings.branding.textHint')}</p>
          </div>

          {/* Position picker */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/50">{t('settings.branding.position')}</label>
            <div className="grid grid-cols-3 grid-rows-3 gap-1.5 mx-auto rounded-xl border border-white/10 bg-white/5 p-3" style={{ aspectRatio: '9/16', maxWidth: '180px' }}>
              {POSITIONS.map(({ value, gridArea }) => (
                <button
                  key={value}
                  onClick={() => updateConfig('position', value)}
                  style={{ gridArea }}
                  className={cn(
                    'flex items-center justify-center rounded-lg border px-1 py-1 text-[10px] font-medium transition-all',
                    config.position === value
                      ? 'border-orange-500 bg-orange-500/20 text-orange-300'
                      : 'border-white/10 bg-white/[0.03] text-white/40 hover:bg-white/10'
                  )}
                >
                  {t(POSITION_LABEL_KEYS[value])}
                </button>
              ))}
            </div>
          </div>

          {/* Display toggles */}
          <div className="space-y-3">
            <label className="text-xs font-medium text-white/50">{t('settings.branding.display')}</label>

            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">{t('settings.branding.showLogo')}</span>
              <button
                onClick={() => updateConfig('showLogo', !config.showLogo)}
                disabled={!config.logoPath && !logoFile}
                className={cn(
                  'relative h-5 w-9 rounded-full transition-colors disabled:opacity-30',
                  config.showLogo ? 'bg-orange-500' : 'bg-white/20'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform',
                    config.showLogo && 'translate-x-4'
                  )}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">{t('settings.branding.showText')}</span>
              <button
                onClick={() => updateConfig('showText', !config.showText)}
                className={cn(
                  'relative h-5 w-9 rounded-full transition-colors',
                  config.showText ? 'bg-orange-500' : 'bg-white/20'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform',
                    config.showText && 'translate-x-4'
                  )}
                />
              </button>
            </div>
          </div>

          {/* Text color */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/50">{t('settings.branding.textColor')}</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={config.textColor}
                onChange={(e) => updateConfig('textColor', e.target.value)}
                className="h-8 w-8 cursor-pointer rounded border border-white/10 bg-transparent"
              />
              <span className="text-xs text-white/40">{config.textColor}</span>
            </div>
          </div>

          {/* Text opacity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-white/50">{t('settings.branding.textOpacity')}</label>
              <span className="text-xs text-white/40">{Math.round(config.textOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={config.textOpacity}
              onChange={(e) => updateConfig('textOpacity', Number(e.target.value))}
              className="w-full accent-orange-500"
            />
          </div>

          {/* Live preview */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/50">{t('settings.branding.preview')}</label>
            <div
              className="relative mx-auto overflow-hidden rounded-xl border border-white/10 bg-slate-800"
              style={{ aspectRatio: '9/16', maxWidth: '200px' }}
            >
              {/* Branding elements */}
              <div className={cn('absolute flex items-center gap-2 max-w-[80%]', positionStyles[config.position])}>
                {config.showLogo && logoPreview && (
                  <img
                    src={logoPreview}
                    alt=""
                    className="h-8 w-auto max-w-[60px] object-contain"
                    style={{ opacity: config.textOpacity }}
                  />
                )}
                {config.showText && config.text && (
                  <span
                    className="text-xs font-bold whitespace-nowrap"
                    style={{
                      color: config.textColor,
                      opacity: config.textOpacity,
                    }}
                  >
                    {config.text}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Save button */}
          <Button
            onClick={handleSave}
            loading={saving}
            icon={Save}
            className="w-full bg-gradient-to-r from-orange-600 to-amber-600"
          >
            {t('common.save')}
          </Button>
        </>
      )}
      </div>
    </Modal>
  )
}
