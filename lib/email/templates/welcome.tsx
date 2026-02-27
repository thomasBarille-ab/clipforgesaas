import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface WelcomeEmailProps {
  userName: string
}

export function WelcomeEmail({ userName }: WelcomeEmailProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://creaclip.io'

  return (
    <Html>
      <Head />
      <Preview>Bienvenue sur ClipForge - Créez des clips viraux en quelques clics</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={heading}>Bienvenue {userName} ! 🎬</Heading>

            <Text style={paragraph}>
              Merci de rejoindre <strong>ClipForge</strong>, la plateforme qui transforme
              vos vidéos longues en clips courts optimisés pour les réseaux sociaux.
            </Text>

            <Text style={paragraph}>
              Pour commencer, uploadez votre première vidéo et laissez notre IA vous
              suggérer les meilleurs moments à clipper.
            </Text>

            <Button style={button} href={`${appUrl}/upload`}>
              Créer mon premier clip
            </Button>

            <Text style={paragraph}>
              Besoin d'aide ? Répondez à cet email ou contactez-nous à{' '}
              <a href="mailto:support@send.creaclip.io" style={link}>
                support@send.creaclip.io
              </a>
            </Text>

            <Text style={footer}>
              L'équipe ClipForge
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
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
  color: '#a78bfa',
  textAlign: 'center' as const,
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#cbd5e1',
  marginBottom: '16px',
}

const button = {
  backgroundColor: '#7c3aed',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '16px',
  marginTop: '32px',
  marginBottom: '32px',
}

const link = {
  color: '#a78bfa',
  textDecoration: 'underline',
}

const footer = {
  color: '#64748b',
  fontSize: '14px',
  marginTop: '32px',
  textAlign: 'center' as const,
}
