import Link from 'next/link'
import {
  Zap,
  Upload,
  Sparkles,
  Wand2,
  Download,
  Captions,
  Palette,
  Smartphone,
  Timer,
  Shield,
  Star,
  ArrowRight,
  Check,
  ChevronDown,
  Play,
} from 'lucide-react'

function Navbar() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
        <Link href="/" className="text-xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Clip
          </span>
          <span className="text-white">Forge</span>
        </Link>

        <div className="hidden items-center gap-8 text-sm text-white/60 md:flex">
          <a href="#features" className="transition-colors hover:text-white">Fonctionnalités</a>
          <a href="#how-it-works" className="transition-colors hover:text-white">Comment ça marche</a>
          <a href="#pricing" className="transition-colors hover:text-white">Tarifs</a>
          <a href="#faq" className="transition-colors hover:text-white">FAQ</a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-white/70 transition-colors hover:text-white sm:block"
          >
            Connexion
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-105"
          >
            Essai gratuit
          </Link>
        </div>
      </div>
    </nav>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-32">
      {/* Background effects */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[128px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-pink-600/15 blur-[128px]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/10 blur-[100px]" />

      <div className="relative mx-auto max-w-6xl px-4 text-center md:px-8">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-1.5 text-sm font-medium text-purple-300">
          <Sparkles className="h-3.5 w-3.5" />
          Propulsé par l&apos;IA — Whisper + Claude
        </div>

        {/* Headline */}
        <h1 className="mx-auto mb-6 max-w-4xl text-4xl font-extrabold leading-[1.1] tracking-tight text-white md:text-6xl lg:text-7xl">
          Transformez vos vidéos en{' '}
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            clips viraux
          </span>{' '}
          en quelques clics
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/50 md:text-xl">
          Uploadez votre vidéo. L&apos;IA transcrit, analyse et identifie les meilleurs moments.
          Personnalisez vos sous-titres et exportez des clips prêts pour TikTok, Reels et Shorts.
        </p>

        {/* CTA */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:scale-105 hover:shadow-purple-500/40"
          >
            <Zap className="h-5 w-5" />
            Commencer gratuitement
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <p className="text-sm text-white/30">Aucune carte bancaire requise</p>
        </div>

        {/* Social proof */}
        <div className="mt-14 flex flex-col items-center gap-3">
          <div className="flex -space-x-2">
            {['bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-fuchsia-500', 'bg-violet-500'].map((bg, i) => (
              <div
                key={i}
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-950 text-xs font-bold text-white ${bg}`}
              >
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <p className="text-sm text-white/40">
            Rejoint par <span className="font-medium text-white/60">500+ créateurs</span> de contenu
          </p>
        </div>

        {/* Demo visual */}
        <div className="mx-auto mt-16 max-w-3xl">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-2 shadow-2xl shadow-purple-500/10 backdrop-blur-sm">
            <div className="relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 to-slate-800">
              {/* Simulated app screenshot */}
              <div className="flex h-full items-center justify-center">
                <div className="flex items-center gap-8">
                  {/* Video source */}
                  <div className="hidden sm:block">
                    <div className="h-40 w-56 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                      <div className="text-center">
                        <Play className="mx-auto mb-2 h-8 w-8 text-white/20" />
                        <p className="text-xs text-white/30">Vidéo source</p>
                        <p className="text-[10px] text-white/15">45:00 min</p>
                      </div>
                    </div>
                  </div>
                  {/* Arrow */}
                  <div className="hidden sm:flex flex-col items-center gap-1">
                    <Sparkles className="h-5 w-5 text-purple-400" />
                    <div className="h-px w-8 bg-gradient-to-r from-purple-500 to-pink-500" />
                    <p className="text-[10px] text-purple-300">IA</p>
                  </div>
                  {/* Generated clips */}
                  <div className="flex gap-3">
                    {[
                      { score: '9.2', color: 'from-purple-500/30 to-pink-500/30' },
                      { score: '8.7', color: 'from-pink-500/30 to-orange-500/30' },
                      { score: '8.1', color: 'from-indigo-500/30 to-purple-500/30' },
                    ].map((clip, i) => (
                      <div key={i} className={`h-36 w-20 rounded-lg bg-gradient-to-b ${clip.color} border border-white/10 flex flex-col items-center justify-center gap-1`}>
                        <Captions className="h-4 w-4 text-white/40" />
                        <p className="text-[10px] font-bold text-white/60">Clip {i + 1}</p>
                        <span className="rounded-full bg-purple-500/40 px-1.5 py-0.5 text-[9px] font-bold text-white">
                          {clip.score}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    {
      step: '01',
      icon: Upload,
      title: 'Uploadez votre vidéo',
      description: 'Glissez-déposez votre vidéo longue (podcast, stream, interview...). MP4, MOV ou AVI jusqu\'à 500 Mo.',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
    },
    {
      step: '02',
      icon: Sparkles,
      title: 'L\'IA analyse tout',
      description: 'Whisper transcrit mot par mot. Claude identifie les passages les plus percutants avec un score de viralité.',
      color: 'text-pink-400',
      bg: 'bg-pink-500/10 border-pink-500/20',
    },
    {
      step: '03',
      icon: Download,
      title: 'Exportez vos clips',
      description: 'Personnalisez les sous-titres, choisissez le style, et téléchargez vos clips au format 9:16 prêts à poster.',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
  ]

  return (
    <section id="how-it-works" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-purple-400">Comment ça marche</p>
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            3 étapes. Aucune compétence technique requise.
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map(({ step, icon: Icon, title, description, color, bg }) => (
            <div key={step} className="relative">
              {/* Connector line */}
              {step !== '03' && (
                <div className="absolute right-0 top-12 hidden h-px w-8 translate-x-full bg-gradient-to-r from-white/10 to-transparent md:block" />
              )}
              <div className={`rounded-2xl border ${bg} p-6 transition-all hover:scale-[1.02]`}>
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-3xl font-black text-white/10">{step}</span>
                  <div className={`rounded-xl bg-white/5 p-2.5 ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-bold text-white">{title}</h3>
                <p className="text-sm leading-relaxed text-white/50">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Features() {
  const features = [
    {
      icon: Captions,
      title: 'Transcription automatique',
      description: 'Whisper transcrit votre vidéo avec une précision professionnelle. Support du français et de l\'anglais.',
    },
    {
      icon: Wand2,
      title: 'Suggestions IA',
      description: 'Claude analyse la transcription et identifie les moments les plus engageants avec un score de viralité.',
    },
    {
      icon: Palette,
      title: 'Sous-titres personnalisables',
      description: 'Police, taille, couleur, contour, position — personnalisez chaque détail avec preview en direct.',
    },
    {
      icon: Smartphone,
      title: 'Format 9:16 natif',
      description: 'Vos clips sont automatiquement recadrés au format vertical, optimisés pour TikTok, Reels et Shorts.',
    },
    {
      icon: Timer,
      title: 'Traitement rapide',
      description: 'Tout se passe dans votre navigateur grâce à FFmpeg WASM. Pas d\'attente serveur, pas de file d\'attente.',
    },
    {
      icon: Shield,
      title: 'Données sécurisées',
      description: 'Vos vidéos sont stockées de manière privée. Seul vous avez accès à votre contenu.',
    },
  ]

  return (
    <section id="features" className="relative py-20 md:py-28">
      <div className="pointer-events-none absolute left-0 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-purple-600/10 blur-[128px]" />

      <div className="relative mx-auto max-w-6xl px-4 md:px-8">
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-purple-400">Fonctionnalités</p>
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Tout ce qu&apos;il faut pour créer des clips qui performent
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all hover:border-purple-500/20 hover:bg-white/[0.05]"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 transition-colors group-hover:from-purple-500/30 group-hover:to-pink-500/30">
                <Icon className="h-5 w-5 text-purple-300" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
              <p className="text-sm leading-relaxed text-white/45">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-purple-400">Tarifs</p>
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Commencez gratuitement, évoluez à votre rythme
          </h2>
        </div>

        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          {/* Free */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white">Gratuit</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">0&euro;</span>
                <span className="text-white/40">/mois</span>
              </div>
              <p className="mt-2 text-sm text-white/40">Pour découvrir ClipForge</p>
            </div>
            <ul className="mb-8 space-y-3">
              {[
                '10 clips par mois',
                'Vidéos jusqu\'à 500 Mo',
                'Transcription automatique',
                'Suggestions IA',
                'Sous-titres personnalisables',
                'Export 9:16',
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-white/60">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
            >
              Commencer gratuitement
            </Link>
          </div>

          {/* Pro */}
          <div className="relative rounded-2xl border border-purple-500/30 bg-gradient-to-b from-purple-500/[0.08] to-transparent p-8">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-1 text-xs font-semibold text-white">
              Populaire
            </div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white">Pro</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">19&euro;</span>
                <span className="text-white/40">/mois</span>
              </div>
              <p className="mt-2 text-sm text-white/40">Pour les créateurs sérieux</p>
            </div>
            <ul className="mb-8 space-y-3">
              {[
                'Clips illimités',
                'Vidéos jusqu\'à 500 Mo',
                'Transcription automatique',
                'Suggestions IA avancées',
                'Sous-titres personnalisables',
                'Export 9:16 HD',
                'Presets de sous-titres illimités',
                'Support prioritaire',
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-white/60">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-purple-400" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              disabled
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-semibold text-white opacity-60 cursor-not-allowed"
            >
              Bientôt disponible
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function FAQ() {
  const questions = [
    {
      q: 'Quels formats de vidéo sont supportés ?',
      a: 'ClipForge accepte les fichiers MP4, MOV et AVI jusqu\'à 500 Mo. La plupart des vidéos de smartphones, caméras et logiciels d\'enregistrement fonctionnent directement.',
    },
    {
      q: 'Combien de temps prend la génération d\'un clip ?',
      a: 'La transcription prend généralement 1 à 3 minutes selon la durée de la vidéo. La génération du clip se fait en quelques secondes directement dans votre navigateur.',
    },
    {
      q: 'Est-ce que mes vidéos sont stockées de façon sécurisée ?',
      a: 'Oui. Vos vidéos sont stockées dans un espace privé accessible uniquement par votre compte. Nous utilisons Supabase avec des politiques de sécurité strictes (Row Level Security).',
    },
    {
      q: 'Le traitement se fait sur vos serveurs ?',
      a: 'La transcription et l\'analyse IA passent par nos serveurs sécurisés. Le montage vidéo (découpe, sous-titres, recadrage) se fait entièrement dans votre navigateur grâce à FFmpeg WASM — vos vidéos ne sont pas envoyées à un serveur tiers.',
    },
    {
      q: 'Puis-je personnaliser les sous-titres ?',
      a: 'Absolument. Vous pouvez modifier la police, la taille, les couleurs, le contour, la position et le fond. Vous pouvez aussi sauvegarder des presets pour les réutiliser sur vos futurs clips.',
    },
    {
      q: 'Je peux annuler mon abonnement Pro ?',
      a: 'Oui, à tout moment. Vous gardez accès aux fonctionnalités Pro jusqu\'à la fin de la période payée, puis votre compte repasse automatiquement en plan gratuit.',
    },
  ]

  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-4 md:px-8">
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-purple-400">FAQ</p>
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Questions fréquentes
          </h2>
        </div>

        <div className="space-y-3">
          {questions.map(({ q, a }) => (
            <details
              key={q}
              className="group rounded-xl border border-white/10 bg-white/[0.03] transition-colors hover:border-white/15 [&[open]]:border-purple-500/20 [&[open]]:bg-purple-500/[0.03]"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-4 text-left font-medium text-white marker:content-none [&::-webkit-details-marker]:hidden">
                {q}
                <ChevronDown className="h-4 w-4 shrink-0 text-white/30 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-6 pb-4">
                <p className="text-sm leading-relaxed text-white/50">{a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCTA() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent p-10 text-center md:p-16">
          <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-purple-500/20 blur-[80px]" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-pink-500/15 blur-[80px]" />

          <div className="relative">
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
              Prêt à créer vos premiers clips ?
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-lg text-white/50">
              Rejoignez les créateurs qui utilisent ClipForge pour transformer leurs vidéos longues en contenu viral.
            </p>
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:scale-105 hover:shadow-purple-500/40"
            >
              <Zap className="h-5 w-5" />
              Commencer gratuitement
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <p className="mt-4 text-sm text-white/30">
              Gratuit pour toujours — aucune carte bancaire requise
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-white/5 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row md:px-8">
        <div className="text-sm font-bold tracking-tight">
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Clip
          </span>
          <span className="text-white">Forge</span>
        </div>

        <div className="flex items-center gap-6 text-sm text-white/30">
          <a href="#features" className="transition-colors hover:text-white/60">Fonctionnalités</a>
          <a href="#pricing" className="transition-colors hover:text-white/60">Tarifs</a>
          <a href="#faq" className="transition-colors hover:text-white/60">FAQ</a>
        </div>

        <p className="text-xs text-white/20">
          &copy; {new Date().getFullYear()} ClipForge. Tous droits réservés.
        </p>
      </div>
    </footer>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/50 to-slate-950">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  )
}
