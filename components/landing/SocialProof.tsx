'use client'

import { motion } from 'framer-motion'

const TESTIMONIALS = [
  {
    name: 'Marie Dubois',
    handle: '@marie_crypto',
    followers: '50K abonnés',
    quote: 'J\'ai économisé 10h par semaine. La pré-sélection guidée est un game-changer. Mon monteur freelance à 400\u20AC/mois ? Viré.',
    stats: ['342 clips', '28h économisées'],
  },
  {
    name: 'Jean Martin',
    handle: '@jean_podcast',
    followers: 'Podcasteur',
    quote: 'La preview live = fini les clips ratés. OpusClip m\'en générait 20 dont 18 inutiles. ClipForge : 100% exploitables.',
    stats: ['127 clips', '150\u20AC économisés'],
  },
  {
    name: 'Julie Leroy',
    handle: '@julie_coach',
    followers: 'Coach business',
    quote: 'L\'export multi-format en 1 clic me fait gagner 30 min par session. Je poste sur TikTok, Instagram ET YouTube sans me prendre la tête.',
    stats: ['89 clips', '+200% engagement'],
  },
]

const STATS = [
  { value: '2,500+', label: 'Créateurs actifs' },
  { value: '45,000+', label: 'Clips générés' },
  { value: '4.9/5', label: 'Note moyenne' },
  { value: '28h', label: 'Économisées en moyenne' },
]

export function SocialProof() {
  return (
    <section className="bg-slate-950 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="mb-16 text-center text-5xl font-bold text-white">
          Ils créent déjà leurs clips sur ClipForge
        </h2>

        <motion.div
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.1 } },
          }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mb-16 grid gap-8 md:grid-cols-3"
        >
          {TESTIMONIALS.map((t) => (
            <motion.div
              key={t.name}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 },
              }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
            >
              <div className="mb-4 flex items-start gap-4">
                <div className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                <div>
                  <strong className="block text-white">{t.name}</strong>
                  <span className="text-sm text-slate-400">
                    {t.handle} &middot; {t.followers}
                  </span>
                </div>
              </div>

              <p className="mb-4 text-slate-300">&laquo; {t.quote} &raquo;</p>

              <div className="flex gap-4 text-sm text-slate-400">
                {t.stats.map((stat) => (
                  <span key={stat}>{stat}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="mb-2 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-4xl font-bold text-transparent">
                {stat.value}
              </div>
              <div className="text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
