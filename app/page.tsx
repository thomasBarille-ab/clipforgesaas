import type { Metadata } from 'next'
import {
  Navbar,
  HeroSection,
  HowItWorks,
  FeaturesSection,
  BeforeAfter,
  StatsBar,
  PricingSection,
  FAQ,
  FinalCTA,
  Footer,
} from '@/components/landing'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'CreaClip',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Web',
      description:
        'CreaClip est l\'outil IA qui transforme vos vidéos longues en clips TikTok, Reels et Shorts en 4 minutes. Pré-sélection guidée, preview live, export multi-format en 1 clic.',
      url: 'https://creaclip.com',
      offers: [
        {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'EUR',
          name: 'Free',
          description: '10 clips par mois, toutes les fonctionnalités, preview live, export multi-format',
        },
        {
          '@type': 'Offer',
          price: '24',
          priceCurrency: 'EUR',
          name: 'Pro',
          description: 'Clips illimités, sans watermark, tous styles de sous-titres, support prioritaire',
        },
        {
          '@type': 'Offer',
          price: '49',
          priceCurrency: 'EUR',
          name: 'Business',
          description: 'Tout Pro + équipe 5 membres, white label, API access, account manager dédié',
        },
      ],
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        ratingCount: '2500',
        bestRating: '5',
      },
      featureList: [
        'Pré-sélection guidée des meilleurs passages',
        'Preview live avec édition temps réel',
        'Export multi-format en 1 clic (TikTok, Reels, Shorts)',
        'Transcription automatique par IA',
        'Sous-titres personnalisables',
        'Traitement vidéo dans le navigateur (FFmpeg WASM)',
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Quels formats de vidéo sont supportés ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'CreaClip accepte les fichiers MP4, MOV et AVI jusqu\'à 500 Mo. La plupart des vidéos de smartphones, caméras et logiciels d\'enregistrement fonctionnent directement.',
          },
        },
        {
          '@type': 'Question',
          name: 'Combien de temps prend la génération d\'un clip ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'La transcription prend généralement 1 à 3 minutes selon la durée de la vidéo. La génération du clip se fait en quelques secondes directement dans votre navigateur.',
          },
        },
        {
          '@type': 'Question',
          name: 'Est-ce que mes vidéos sont stockées de façon sécurisée ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Oui. Vos vidéos sont stockées dans un espace privé accessible uniquement par votre compte. Nous utilisons Supabase avec des politiques de sécurité strictes (Row Level Security).',
          },
        },
        {
          '@type': 'Question',
          name: 'Le traitement se fait sur vos serveurs ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'La transcription et l\'analyse IA passent par nos serveurs sécurisés. Le montage vidéo (découpe, sous-titres, recadrage) se fait entièrement dans votre navigateur grâce à FFmpeg WASM — vos vidéos ne sont pas envoyées à un serveur tiers.',
          },
        },
        {
          '@type': 'Question',
          name: 'Puis-je personnaliser les sous-titres ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Absolument. Vous pouvez modifier la police, la taille, les couleurs, le contour, la position et le fond. Vous pouvez aussi sauvegarder des presets pour les réutiliser sur vos futurs clips.',
          },
        },
        {
          '@type': 'Question',
          name: 'Je peux annuler mon abonnement Pro ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Oui, à tout moment. Vous gardez accès aux fonctionnalités Pro jusqu\'à la fin de la période payée, puis votre compte repasse automatiquement en plan gratuit.',
          },
        },
      ],
    },
    {
      '@type': 'WebSite',
      name: 'CreaClip',
      url: 'https://creaclip.com',
      description: 'Outil IA de création de clips vidéo courts à partir de vidéos longues',
      inLanguage: ['fr', 'en', 'es'],
    },
    {
      '@type': 'Organization',
      name: 'CreaClip',
      url: 'https://creaclip.com',
      sameAs: [],
    },
  ],
}

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <HeroSection />
      <HowItWorks />
      {/* <FeaturesSection /> */}
      <BeforeAfter />
      <StatsBar />
      <PricingSection />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  )
}
