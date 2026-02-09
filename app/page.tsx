import Link from 'next/link'
import { Sparkles, Zap, Film } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950/50 to-slate-950">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-pink-600/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-4 text-center">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 backdrop-blur-sm">
          <Sparkles className="h-4 w-4 text-purple-400" />
          Propulsé par l&apos;IA
        </div>

        {/* Headline */}
        <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-white md:text-6xl lg:text-7xl">
          Transformez vos vidéos en{' '}
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            clips viraux
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mb-10 max-w-2xl text-lg text-white/60 md:text-xl">
          ClipForge analyse vos vidéos, transcrit automatiquement le contenu et
          vous suggère les meilleurs moments à extraire. En quelques clics.
        </p>

        {/* CTA */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 text-lg font-semibold text-white transition-transform hover:scale-105"
          >
            <Zap className="h-5 w-5" />
            Commencer gratuitement
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-lg font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
          >
            Se connecter
          </Link>
        </div>

        {/* Features */}
        <div className="mt-20 grid w-full gap-4 md:grid-cols-3 md:gap-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <Film className="mb-3 h-8 w-8 text-purple-400" />
            <h3 className="mb-1 font-semibold text-white">Upload simple</h3>
            <p className="text-sm text-white/50">
              Glissez-déposez vos vidéos MP4, MOV ou AVI jusqu&apos;à 500 Mo
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <Sparkles className="mb-3 h-8 w-8 text-pink-400" />
            <h3 className="mb-1 font-semibold text-white">IA intelligente</h3>
            <p className="text-sm text-white/50">
              Transcription Whisper et suggestions de clips par Claude AI
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <Zap className="mb-3 h-8 w-8 text-emerald-400" />
            <h3 className="mb-1 font-semibold text-white">Export rapide</h3>
            <p className="text-sm text-white/50">
              Générez et téléchargez vos clips en quelques secondes
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
