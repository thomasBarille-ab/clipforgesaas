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

interface ClipReadyEmailProps {
  clipTitle: string
  clipUrl: string
}

export function ClipReadyEmail({ clipTitle, clipUrl }: ClipReadyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your clip "{clipTitle}" is ready to download!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={heading}>Your clip is ready!</Heading>

            <Text style={paragraph}>
              Great news! Your clip <strong>"{clipTitle}"</strong> has been successfully
              generated and is now available.
            </Text>

            <Text style={paragraph}>
              You can download it, share it on your social media,
              or continue editing it.
            </Text>

            <Button style={button} href={clipUrl}>
              View my clip
            </Button>

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

const footer = {
  color: '#64748b',
  fontSize: '14px',
  marginTop: '32px',
  textAlign: 'center' as const,
}
