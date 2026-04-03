import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

const PLAN_LABELS: Record<string, string> = {
  pro: 'Pro',
  business: 'Business',
  free: 'Free',
}

const PLAN_PRICES: Record<string, string> = {
  pro: '$29/mo',
  business: '$49/mo',
  free: '$0',
}

const PLAN_CLIPS: Record<string, string> = {
  pro: '40 clips/month',
  business: '150 clips/month',
  free: '3 clips/month',
}

// Subscription started email
interface SubscriptionStartedProps {
  plan: string
}

export function SubscriptionStartedEmail({ plan }: SubscriptionStartedProps) {
  const label = PLAN_LABELS[plan] || plan
  const price = PLAN_PRICES[plan] || ''

  return (
    <Html>
      <Head />
      <Preview>Your {label} subscription is now active!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={heading}>{label} Plan Activated!</Heading>
            <Text style={paragraph}>
              Thank you for your trust! Your <strong>{label}</strong> subscription ({price}) is now active.
            </Text>
            <Text style={paragraph}>
              You now have access to all the features of your plan:
            </Text>
            <Text style={list}>
              {PLAN_CLIPS[plan] || '50 clips/month'}{'\n'}
              No watermark{'\n'}
              AI-powered prompt search
              {plan === 'business' ? '\nCustom creator persona' : ''}
            </Text>
            <Text style={footer}>The CreaClip Team</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Plan changed email
interface SubscriptionChangedProps {
  oldPlan: string
  newPlan: string
}

export function SubscriptionChangedEmail({ oldPlan, newPlan }: SubscriptionChangedProps) {
  const oldLabel = PLAN_LABELS[oldPlan] || oldPlan
  const newLabel = PLAN_LABELS[newPlan] || newPlan
  const newPrice = PLAN_PRICES[newPlan] || ''

  return (
    <Html>
      <Head />
      <Preview>Your plan has been changed to {newLabel}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={heading}>Plan Changed</Heading>
            <Text style={paragraph}>
              Your subscription has been changed from <strong>{oldLabel}</strong> to <strong>{newLabel}</strong> ({newPrice}).
            </Text>
            <Text style={paragraph}>
              The changes are effective immediately.
            </Text>
            <Text style={footer}>The CreaClip Team</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Subscription canceled email
export function SubscriptionCanceledEmail() {
  return (
    <Html>
      <Head />
      <Preview>Your subscription has been canceled</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={heading}>Subscription Canceled</Heading>
            <Text style={paragraph}>
              Your CreaClip subscription has been canceled. You have been switched back to the <strong>Free</strong> plan.
            </Text>
            <Text style={paragraph}>
              You still have access to 3 clips per month. Your existing clips remain available.
            </Text>
            <Text style={paragraph}>
              You can resubscribe at any time from your account settings.
            </Text>
            <Text style={footer}>The CreaClip Team</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Invoice paid email
interface InvoicePaidProps {
  amount: string
  invoiceUrl: string
  plan: string
}

export function InvoicePaidEmail({ amount, invoiceUrl, plan }: InvoicePaidProps) {
  const label = PLAN_LABELS[plan] || plan

  return (
    <Html>
      <Head />
      <Preview>CreaClip Invoice - {amount}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={heading}>Payment Received</Heading>
            <Text style={paragraph}>
              We have received your payment of <strong>{amount}</strong> for the <strong>{label}</strong> plan.
            </Text>
            <Text style={paragraph}>
              <a href={invoiceUrl} style={link}>View invoice</a>
            </Text>
            <Text style={footer}>The CreaClip Team</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Payment failed email
interface PaymentFailedProps {
  portalUrl: string
}

export function PaymentFailedEmail({ portalUrl }: PaymentFailedProps) {
  return (
    <Html>
      <Head />
      <Preview>Issue with your CreaClip payment</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={heading}>Payment Failed</Heading>
            <Text style={paragraph}>
              Your latest CreaClip payment could not be processed. Your subscription may be suspended if the issue persists.
            </Text>
            <Text style={paragraph}>
              Please update your payment method to continue enjoying your subscription:
            </Text>
            <Text style={paragraph}>
              <a href={portalUrl} style={link}>Update my payment method</a>
            </Text>
            <Text style={paragraph}>
              If you have any questions, contact us at contact@creaclip.io.
            </Text>
            <Text style={footer}>The CreaClip Team</Text>
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

const list = {
  fontSize: '16px',
  lineHeight: '32px',
  color: '#cbd5e1',
  marginBottom: '16px',
  whiteSpace: 'pre-line' as const,
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
