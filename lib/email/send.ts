import { resend, FROM_EMAIL } from './client'
import { WelcomeEmail } from './templates/welcome'
import { ClipReadyEmail } from './templates/clip-ready'

/**
 * Envoie un email de bienvenue à un nouvel utilisateur
 */
export async function sendWelcomeEmail(to: string, userName: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Bienvenue sur ClipForge ! 🎬',
      react: WelcomeEmail({ userName }),
    })

    if (error) {
      console.error('Email send error:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Email send exception:', error)
    return { success: false, error }
  }
}

/**
 * Envoie une notification quand un clip est prêt
 */
export async function sendClipReadyEmail(
  to: string,
  clipTitle: string,
  clipUrl: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Votre clip "${clipTitle}" est prêt ! 🎉`,
      react: ClipReadyEmail({ clipTitle, clipUrl }),
    })

    if (error) {
      console.error('Email send error:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Email send exception:', error)
    return { success: false, error }
  }
}

/**
 * Envoie une confirmation de paiement
 */
export async function sendPaymentSuccessEmail(
  to: string,
  plan: string,
  amount: number
) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Paiement confirmé - Plan ${plan} 💳`,
      html: `
        <h1>Paiement confirmé !</h1>
        <p>Merci pour votre abonnement au plan <strong>${plan}</strong>.</p>
        <p>Montant : ${amount}€</p>
        <p>Vous avez maintenant accès à toutes les fonctionnalités premium.</p>
      `,
    })

    if (error) {
      console.error('Email send error:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Email send exception:', error)
    return { success: false, error }
  }
}
