import { resend, FROM_EMAIL } from './client'
import { WelcomeEmail } from './templates/welcome'
import { ClipReadyEmail } from './templates/clip-ready'
import {
  SubscriptionStartedEmail,
  SubscriptionChangedEmail,
  SubscriptionCanceledEmail,
  InvoicePaidEmail,
  PaymentFailedEmail,
} from './templates/subscription'
import { ExpiryWarningEmail } from './templates/expiry-warning'

export async function sendWelcomeEmail(to: string, userName: string): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Bienvenue sur CreaClip ! 🎬',
      react: WelcomeEmail({ userName }),
    })
    if (error) {
      console.error('Email send error:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Email send exception:', error)
    return false
  }
}

export async function sendClipReadyEmail(to: string, clipTitle: string, clipUrl: string): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Votre clip "${clipTitle}" est prêt ! 🎉`,
      react: ClipReadyEmail({ clipTitle, clipUrl }),
    })
    if (error) {
      console.error('Email send error:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Email send exception:', error)
    return false
  }
}

export async function sendSubscriptionStartedEmail(to: string, plan: string): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Abonnement ${plan === 'business' ? 'Business' : 'Pro'} activé ! 🚀`,
      react: SubscriptionStartedEmail({ plan }),
    })
    if (error) {
      console.error('Email send error:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Email send exception:', error)
    return false
  }
}

export async function sendSubscriptionChangedEmail(to: string, oldPlan: string, newPlan: string): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Plan modifié : ${newPlan === 'business' ? 'Business' : 'Pro'} ✅`,
      react: SubscriptionChangedEmail({ oldPlan, newPlan }),
    })
    if (error) {
      console.error('Email send error:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Email send exception:', error)
    return false
  }
}

export async function sendSubscriptionCanceledEmail(to: string): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Votre abonnement a été annulé',
      react: SubscriptionCanceledEmail(),
    })
    if (error) {
      console.error('Email send error:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Email send exception:', error)
    return false
  }
}

export async function sendInvoicePaidEmail(to: string, amount: string, invoiceUrl: string, plan: string): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Facture CreaClip - ${amount} 💳`,
      react: InvoicePaidEmail({ amount, invoiceUrl, plan }),
    })
    if (error) {
      console.error('Email send error:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Email send exception:', error)
    return false
  }
}

export async function sendPaymentFailedEmail(to: string, portalUrl: string): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Problème avec votre paiement CreaClip ⚠️',
      react: PaymentFailedEmail({ portalUrl }),
    })
    if (error) {
      console.error('Email send error:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Email send exception:', error)
    return false
  }
}

interface ExpiryItem {
  title: string
}

export async function sendExpiryWarningEmail(
  to: string,
  videos: ExpiryItem[],
  clips: ExpiryItem[]
): Promise<boolean> {
  const totalCount = videos.length + clips.length
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.creaclip.com'
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${totalCount} fichier${totalCount > 1 ? 's' : ''} expire${totalCount > 1 ? 'nt' : ''} demain`,
      react: ExpiryWarningEmail({ videos, clips, appUrl }),
    })
    if (error) {
      console.error('Email send error:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Email send exception:', error)
    return false
  }
}
