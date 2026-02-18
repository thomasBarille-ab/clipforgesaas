import { ChevronDown } from 'lucide-react'

const QUESTIONS = [
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

export function FAQ() {
  return (
    <section id="faq" className="bg-slate-950 py-20">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-purple-400">FAQ</p>
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Questions fréquentes
          </h2>
        </div>

        <div className="space-y-3">
          {QUESTIONS.map(({ q, a }) => (
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
