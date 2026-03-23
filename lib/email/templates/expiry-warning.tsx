import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface ExpiryItem {
  title: string
}

interface ExpiryWarningEmailProps {
  videos: ExpiryItem[]
  clips: ExpiryItem[]
  appUrl: string
}

export function ExpiryWarningEmail({ videos, clips, appUrl }: ExpiryWarningEmailProps) {
  const totalCount = videos.length + clips.length

  return (
    <Html>
      <Head />
      <Preview>
        {`${totalCount} fichier${totalCount > 1 ? 's' : ''} expire${totalCount > 1 ? 'nt' : ''} demain`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={heading}>Vos fichiers expirent demain</Heading>
            <Text style={paragraph}>
              Les fichiers suivants seront automatiquement supprimés dans les prochaines <strong>24 heures</strong>.
              Pensez à télécharger ceux que vous souhaitez conserver.
            </Text>

            {videos.length > 0 && (
              <>
                <Text style={sectionTitle}>
                  Vidéos ({videos.length})
                </Text>
                <Text style={list}>
                  {videos.map((v) => `• ${v.title}`).join('\n')}
                </Text>
              </>
            )}

            {clips.length > 0 && (
              <>
                <Text style={sectionTitle}>
                  Clips ({clips.length})
                </Text>
                <Text style={list}>
                  {clips.map((c) => `• ${c.title}`).join('\n')}
                </Text>
              </>
            )}

            <Section style={ctaContainer}>
              <Link href={`${appUrl}/videos`} style={ctaButton}>
                Télécharger mes fichiers
              </Link>
            </Section>

            <Text style={hint}>
              Les vidéos et clips sont disponibles 7 jours après leur création. Passé ce délai, ils sont automatiquement supprimés.
            </Text>

            <Text style={footer}>L'équipe CreaClip</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#0f172a',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#1e293b',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
}

const box = {
  padding: '0 48px',
}

const heading = {
  fontSize: '32px',
  fontWeight: 'bold',
  marginBottom: '48px',
  color: '#fb923c',
  textAlign: 'center' as const,
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#cbd5e1',
  marginBottom: '16px',
}

const sectionTitle = {
  fontSize: '14px',
  fontWeight: 'bold' as const,
  color: '#a78bfa',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  marginBottom: '8px',
  marginTop: '24px',
}

const list = {
  fontSize: '16px',
  lineHeight: '32px',
  color: '#cbd5e1',
  marginBottom: '16px',
  whiteSpace: 'pre-line' as const,
}

const ctaContainer = {
  textAlign: 'center' as const,
  marginTop: '32px',
  marginBottom: '32px',
}

const ctaButton = {
  backgroundColor: '#ea580c',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}

const hint = {
  fontSize: '13px',
  lineHeight: '20px',
  color: '#64748b',
  marginTop: '16px',
}

const footer = {
  color: '#64748b',
  fontSize: '14px',
  marginTop: '32px',
  textAlign: 'center' as const,
}
