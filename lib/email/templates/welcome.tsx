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
      <Preview>Welcome to CreaClip - Create viral clips in a few clicks</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={heading}>Welcome {userName}!</Heading>

            <Text style={paragraph}>
              Thanks for joining <strong>CreaClip</strong>, the platform that turns
              your long videos into short clips optimized for social media.
            </Text>

            <Text style={paragraph}>
              To get started, upload your first video and let our AI suggest
              the best moments to clip.
            </Text>

            <Button style={button} href={`${appUrl}/upload`}>
              Create my first clip
            </Button>

            <Text style={paragraph}>
              Need help? Reply to this email or contact us at{' '}
              <a href="mailto:contact@creaclip.io" style={link}>
                contact@creaclip.io
              </a>
            </Text>

            <Text style={footer}>
              The CreaClip Team
            </Text>
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
