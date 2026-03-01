import { Resend } from 'resend';

const FROM = 'Prop <noreply@prop.ng>';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? 'placeholder');
}

export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<void> {
  const resend = getResend();
  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
}

export async function sendDisputeOpenedEmail(params: {
  agentEmail: string;
  clientEmail: string;
  listingTitle: string;
  disputeId: string;
}): Promise<void> {
  const html = `
    <h2>Inspection Dispute Opened</h2>
    <p>A dispute has been raised for the inspection of <strong>${params.listingTitle}</strong>.</p>
    <p>Dispute Reference: <code>${params.disputeId}</code></p>
    <p>Our team will review the evidence and resolve within 48 hours.</p>
    <p>— The Prop Team</p>
  `;
  await Promise.all([
    sendEmail({ to: params.agentEmail, subject: 'Inspection Dispute Opened', html }),
    sendEmail({ to: params.clientEmail, subject: 'Inspection Dispute Opened', html }),
  ]);
}

export async function sendCrossPostFlagEmail(params: {
  agentEmail: string;
  listingTitle: string;
  deadlineAt: Date;
}): Promise<void> {
  const html = `
    <h2>Cross-posting Alert</h2>
    <p>Your listing <strong>${params.listingTitle}</strong> has been flagged for potential cross-posting.</p>
    <p>Please resolve this by <strong>${params.deadlineAt.toLocaleString('en-NG')}</strong> or the listing will be automatically paused.</p>
    <p>— The Prop Team</p>
  `;
  await sendEmail({ to: params.agentEmail, subject: 'Action Required: Cross-posting Flag', html });
}

export async function sendSubscriptionExpiringEmail(params: {
  agentEmail: string;
  expiresAt: Date;
}): Promise<void> {
  const html = `
    <h2>Subscription Expiring Soon</h2>
    <p>Your Prop subscription expires on <strong>${params.expiresAt.toLocaleDateString('en-NG')}</strong>.</p>
    <p>Renew now to keep your listings active and continue receiving leads.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription"
       style="background:#1A6B3C;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">
      Renew Subscription
    </a>
    <p>— The Prop Team</p>
  `;
  await sendEmail({
    to: params.agentEmail,
    subject: 'Your Prop Subscription is Expiring',
    html,
  });
}

export default getResend;
