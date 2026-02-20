'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Type,
  ALargeSmall,
  Palette,
  PaintBucket,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  CaseSensitive,
  CaseUpper,
  RectangleHorizontal,
  Power,
  Save,
  X,
  BookmarkCheck,
  ChevronDown,
  Captions,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import {
  FONT_OPTIONS,
  FONT_SIZE_MAP,
  TEXT_COLOR_PRESETS,
  STROKE_COLOR_PRESETS,
  loadPresets,
  savePreset,
  deletePreset,
} from '@/types/subtitles'
import type { SubtitleStyle, SubtitlePreset } from '@/types/subtitles'

interface SubtitleEditorProps {
  style: SubtitleStyle
  onChange: (style: SubtitleStyle) => void
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 text-sm font-medium text-white/70">
        <Icon className="h-4 w-4" />
        {title}
      </div>
      {children}
    </div>
  )
}

function ColorSwatch({
  color,
  selected,
  onClick,
}: {
  color: string
  selected: boolean
  onClick: () => void
}) {
  const isTransparent = color === 'transparent'
  return (
    <button
      onClick={onClick}
      className={cn(
        'h-8 w-8 rounded-lg border-2 transition-all',
        selected ? 'border-purple-400 scale-110' : 'border-white/20 hover:border-white/40'
      )}
      style={{ backgroundColor: isTransparent ? undefined : color }}
    >
      {isTransparent && (
        <div className="flex h-full w-full items-center justify-center text-[10px] text-white/40">∅</div>
      )}
    </button>
  )
}

export function SubtitleEditor({ style, onChange }: SubtitleEditorProps) {
  const { t } = useTranslation()
  const [presets, setPresets] = useState<SubtitlePreset[]>([])
  const [saving, setSaving] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [open, setOpen] = useState(true)
  const toast = useToast()

  useEffect(() => {
    setPresets(loadPresets())
  }, [])

  function update<K extends keyof SubtitleStyle>(key: K, value: SubtitleStyle[K]) {
    onChange({ ...style, [key]: value })
  }

  function handleSavePreset() {
    if (!presetName.trim()) return
    const preset = savePreset(presetName.trim(), style)
    setPresets((prev) => [...prev, preset])
    setPresetName('')
    setSaving(false)
    toast.success(t('subtitles.presetSaved'))
  }

  function handleDeletePreset(id: string) {
    deletePreset(id)
    setPresets((prev) => prev.filter((p) => p.id !== id))
    toast.success(t('subtitles.presetDeleted'))
  }

  function handleApplyPreset(preset: SubtitlePreset) {
    onChange({ ...preset.style })
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
      {/* Header collapsible */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 p-5 text-left"
      >
        <Captions className="h-4 w-4 text-white/50" />
        <span className="text-sm font-semibold text-white">{t('subtitles.title')}</span>
        {/* Toggle ON/OFF */}
        <span
          onClick={(e) => { e.stopPropagation(); update('enabled', !style.enabled) }}
          className={cn(
            'ml-auto mr-2 cursor-pointer rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors',
            style.enabled ? 'bg-purple-500/30 text-purple-200' : 'bg-white/10 text-white/40'
          )}
        >
          {style.enabled ? 'ON' : 'OFF'}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-white/40 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
      <div className="space-y-6 px-5 pb-5">
      {/* Presets */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-white/70">
            <BookmarkCheck className="h-4 w-4" />
            {t('subtitles.presets')}
          </div>
          {!saving && (
            <button
              onClick={() => setSaving(true)}
              className="flex items-center gap-1 text-xs text-purple-400 transition-colors hover:text-purple-300"
            >
              <Save className="h-3 w-3" />
              {t('subtitles.savePreset')}
            </button>
          )}
        </div>

        {/* Formulaire de sauvegarde */}
        {saving && (
          <div className="flex gap-2">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
              placeholder={t('subtitles.presetNamePlaceholder')}
              autoFocus
              className="flex-1 rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:border-purple-500 focus:outline-none"
            />
            <button
              onClick={handleSavePreset}
              disabled={!presetName.trim()}
              className="rounded-lg bg-purple-500/20 px-3 py-1.5 text-sm font-medium text-purple-300 transition-colors hover:bg-purple-500/30 disabled:opacity-40"
            >
              OK
            </button>
            <button
              onClick={() => { setSaving(false); setPresetName('') }}
              className="rounded-lg bg-white/10 px-2 py-1.5 text-white/40 transition-colors hover:bg-white/15 hover:text-white/60"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Liste des presets */}
        {presets.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="group flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 transition-all hover:border-purple-500/30"
              >
                <button
                  onClick={() => handleApplyPreset(preset)}
                  className="flex items-center gap-1.5 py-1.5 pl-3 pr-1 text-sm text-white/70 transition-colors hover:text-white"
                >
                  <span
                    className="h-3 w-3 rounded-full border border-white/20"
                    style={{ backgroundColor: preset.style.textColor }}
                  />
                  {preset.name}
                </button>
                <button
                  onClick={() => handleDeletePreset(preset.id)}
                  className="rounded-r-lg px-1.5 py-1.5 text-white/20 transition-colors hover:text-red-400"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-white/30">{t('subtitles.noPresets')}</p>
        )}
      </div>

      {style.enabled && (
        <>
          {/* Police */}
          <Section title={t('subtitles.font')} icon={Type}>
            <div className="grid grid-cols-2 gap-2">
              {FONT_OPTIONS.map((font) => (
                <button
                  key={font.value}
                  onClick={() => update('fontFamily', font.value)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-sm transition-all',
                    style.fontFamily === font.value
                      ? 'border-purple-500 bg-purple-500/20 text-white'
                      : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white'
                  )}
                  style={{ fontFamily: `'${font.value}', sans-serif` }}
                >
                  {font.label}
                </button>
              ))}
            </div>
          </Section>

          {/* Taille */}
          <Section title={t('subtitles.size')} icon={ALargeSmall}>
            <div className="flex gap-2">
              {(Object.keys(FONT_SIZE_MAP) as SubtitleStyle['fontSize'][]).map((size) => (
                <button
                  key={size}
                  onClick={() => update('fontSize', size)}
                  className={cn(
                    'flex-1 rounded-lg border py-2 text-sm font-medium transition-all',
                    style.fontSize === size
                      ? 'border-purple-500 bg-purple-500/20 text-white'
                      : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                  )}
                >
                  {FONT_SIZE_MAP[size].label}
                </button>
              ))}
            </div>
          </Section>

          {/* Couleur du texte */}
          <Section title={t('subtitles.textColor')} icon={Palette}>
            <div className="flex flex-wrap gap-2">
              {TEXT_COLOR_PRESETS.map((color) => (
                <ColorSwatch
                  key={color}
                  color={color}
                  selected={style.textColor === color}
                  onClick={() => update('textColor', color)}
                />
              ))}
              <label className="relative">
                <input
                  type="color"
                  value={style.textColor}
                  onChange={(e) => update('textColor', e.target.value)}
                  className="absolute inset-0 h-8 w-8 cursor-pointer opacity-0"
                />
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-dashed border-white/20 text-xs text-white/40 hover:border-white/40">
                  +
                </div>
              </label>
            </div>
          </Section>

          {/* Contour */}
          <Section title={t('subtitles.stroke')} icon={PaintBucket}>
            <div className="flex flex-wrap gap-2">
              {STROKE_COLOR_PRESETS.map((color) => (
                <ColorSwatch
                  key={color}
                  color={color}
                  selected={style.strokeColor === color}
                  onClick={() => update('strokeColor', color)}
                />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/40">{t('subtitles.strokeWidth')}</span>
              <input
                type="range"
                min={0}
                max={8}
                step={1}
                value={style.strokeWidth}
                onChange={(e) => update('strokeWidth', Number(e.target.value))}
                className="flex-1 accent-purple-500"
              />
              <span className="w-6 text-right text-xs text-white/50">{style.strokeWidth}</span>
            </div>
          </Section>

          {/* Position */}
          <Section title={t('subtitles.position')} icon={AlignVerticalJustifyCenter}>
            <div className="flex gap-2">
              {([
                { value: 'top', labelKey: 'subtitles.positionTop', icon: AlignVerticalJustifyStart },
                { value: 'center', labelKey: 'subtitles.positionCenter', icon: AlignVerticalJustifyCenter },
                { value: 'bottom', labelKey: 'subtitles.positionBottom', icon: AlignVerticalJustifyEnd },
              ] as const).map(({ value, labelKey, icon: PosIcon }) => (
                <button
                  key={value}
                  onClick={() => update('position', value)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-sm transition-all',
                    style.position === value
                      ? 'border-purple-500 bg-purple-500/20 text-white'
                      : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                  )}
                >
                  <PosIcon className="h-3.5 w-3.5" />
                  {t(labelKey)}
                </button>
              ))}
            </div>
          </Section>

          {/* Style texte */}
          <div className="flex gap-3">
            {/* Casse */}
            <div className="flex-1 space-y-2.5">
              <div className="flex items-center gap-2 text-sm font-medium text-white/70">
                <CaseSensitive className="h-4 w-4" />
                {t('subtitles.case')}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => update('textTransform', 'none')}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1 rounded-lg border py-2 text-sm transition-all',
                    style.textTransform === 'none'
                      ? 'border-purple-500 bg-purple-500/20 text-white'
                      : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                  )}
                >
                  <CaseSensitive className="h-3.5 w-3.5" />
                  Aa
                </button>
                <button
                  onClick={() => update('textTransform', 'uppercase')}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1 rounded-lg border py-2 text-sm transition-all',
                    style.textTransform === 'uppercase'
                      ? 'border-purple-500 bg-purple-500/20 text-white'
                      : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                  )}
                >
                  <CaseUpper className="h-3.5 w-3.5" />
                  AA
                </button>
              </div>
            </div>

            {/* Fond */}
            <div className="flex-1 space-y-2.5">
              <div className="flex items-center gap-2 text-sm font-medium text-white/70">
                <RectangleHorizontal className="h-4 w-4" />
                {t('subtitles.background')}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => update('background', 'none')}
                  className={cn(
                    'flex-1 rounded-lg border py-2 text-sm transition-all',
                    style.background === 'none'
                      ? 'border-purple-500 bg-purple-500/20 text-white'
                      : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                  )}
                >
                  {t('subtitles.backgroundNone')}
                </button>
                <button
                  onClick={() => update('background', 'box')}
                  className={cn(
                    'flex-1 rounded-lg border py-2 text-sm transition-all',
                    style.background === 'box'
                      ? 'border-purple-500 bg-purple-500/20 text-white'
                      : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                  )}
                >
                  {t('subtitles.backgroundBox')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
      )}
    </div>
  )
}
