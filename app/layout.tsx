import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/Providers'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://creaclip.com'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'CreaClip — Transformez vos vidéos longues en clips viraux avec l\'IA',
    template: '%s | CreaClip',
  },
  description:
    'CreaClip est l\'outil IA qui transforme vos vidéos longues en clips TikTok, Reels et Shorts en 4 minutes. Pré-sélection guidée, preview live, export multi-format en 1 clic. Essai gratuit, 10 clips offerts.',
  keywords: [
    'créer clips vidéo IA',
    'couper vidéo en clips automatiquement',
    'outil clips TikTok',
    'outil clips Reels',
    'outil clips YouTube Shorts',
    'montage vidéo automatique IA',
    'transcription vidéo automatique',
    'sous-titres automatiques vidéo',
    'repurpose vidéo',
    'clip vidéo gratuit',
    'SaaS montage vidéo',
    'CreaClip',
    'créateur de contenu',
    'video clipping tool',
    'AI video editor',
    'repurpose long videos',
  ],
  authors: [{ name: 'CreaClip' }],
  creator: 'CreaClip',
  publisher: 'CreaClip',
  applicationName: 'CreaClip',
  category: 'Technology',
  openGraph: {
    title: 'CreaClip — Transformez vos vidéos longues en clips viraux avec l\'IA',
    description:
      'L\'IA qui crée vos clips TikTok, Reels et Shorts en 4 minutes. Pré-sélection guidée, preview live, export multi-format. 10 clips gratuits.',
    type: 'website',
    locale: 'fr_FR',
    alternateLocale: ['en_US', 'es_ES'],
    siteName: 'CreaClip',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CreaClip — Clips viraux en 4 minutes avec l\'IA',
    description:
      'Transformez vos vidéos longues en clips TikTok, Reels et Shorts. Pré-sélection guidée + preview live + export 1 clic.',
    creator: '@creaclip',
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      'fr': `${SITE_URL}`,
      'en': `${SITE_URL}?lang=en`,
      'es': `${SITE_URL}?lang=es`,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className="dark">
      <head>
        <script
          type="importmap"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              imports: {
                '@ffmpeg/ffmpeg': 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.js',
                '@ffmpeg/util': 'https://unpkg.com/@ffmpeg/util@0.12.1/dist/esm/index.js',
              },
            }),
          }}
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased bg-slate-950 text-white`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
