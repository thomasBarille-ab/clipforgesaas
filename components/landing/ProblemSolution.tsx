export function ProblemSolution() {
  return (
    <section id="how-it-works" className="bg-slate-950 py-20">
      <div className="mx-auto max-w-6xl px-6">
        {/* Problem */}
        <div className="mb-20">
          <h2 className="mb-12 text-center text-4xl font-bold text-white">
            Le problème
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { emoji: '&#9200;', title: '2-5h par semaine', desc: 'Perdues à créer des clips manuellement' },
              { emoji: '&#128176;', title: '400\u20AC+ par mois', desc: 'Pour un monteur freelance' },
              { emoji: '&#127919;', title: "L'IA rate tout", desc: '90% des clips auto-générés inutilisables' },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-xl">
                <span className="mb-4 block text-5xl" dangerouslySetInnerHTML={{ __html: emoji }} />
                <h3 className="mb-2 text-2xl font-bold text-white">{title}</h3>
                <p className="text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Solution */}
        <div>
          <h2 className="mb-12 text-center text-4xl font-bold text-white">
            La solution ClipForge
          </h2>
          <div className="mx-auto max-w-3xl space-y-6">
            {[
              { num: 1, title: 'Vous guidez', desc: 'Surlignez vos meilleurs passages (30 sec)' },
              { num: 2, title: "L'IA exécute", desc: 'Génère clips dans ces zones (2 min)' },
              { num: 3, title: 'Vous validez', desc: 'Preview live + édition temps réel (1 min)' },
              { num: 4, title: 'Export parfait', desc: 'Multi-format en 1 clic (30 sec)' },
            ].map((step) => (
              <div key={step.num} className="flex items-center gap-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-2xl font-bold">
                  {step.num}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{step.title}</h3>
                  <p className="text-slate-400">{step.desc}</p>
                </div>
              </div>
            ))}

            <div className="mt-8 rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-6 text-center">
              <strong className="mb-2 block text-2xl text-white">Total : 4 minutes</strong>
              <span className="text-slate-300">vs 2-5h avec les concurrents</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
