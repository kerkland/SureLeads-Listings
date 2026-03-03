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

// ─── Reconfirmation emails ────────────────────────────────────────────────────

/**
 * Warning digest — sent once on Day 5 for ALL listings entering PENDING_RECONFIRMATION.
 * Never sent more than once per cycle per agent to prevent inbox fatigue.
 */
export async function sendReconfirmationWarningEmail(params: {
  agentEmail:   string;
  agentName:    string;
  listings:     { title: string; dueAt: Date }[];
  reconfirmUrl: string;
}): Promise<void> {
  const listingRows = params.listings
    .map(
      (l) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#1e293b;">${l.title}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#d97706;font-weight:600;">
            Due ${l.dueAt.toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' })}
          </td>
        </tr>`,
    )
    .join('');

  const plural = params.listings.length > 1 ? 's' : '';
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
      <div style="background:#d97706;padding:24px 32px;">
        <h1 style="color:#fff;margin:0;font-size:20px;">⚠ Reconfirmation Needed</h1>
        <p style="color:#fef3c7;margin:6px 0 0;">SureLeads · Action required within 2 days</p>
      </div>
      <div style="padding:32px;">
        <p style="color:#1e293b;font-size:15px;">Hi ${params.agentName},</p>
        <p style="color:#475569;font-size:14px;line-height:1.6;">
          Your listing${plural} below need${plural === '' ? 's' : ''} to be reconfirmed to stay visible on SureLeads.
          Reconfirming takes seconds and lets tenants know the property is still available.
        </p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;">Listing</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;">Due</th>
            </tr>
          </thead>
          <tbody>${listingRows}</tbody>
        </table>
        <div style="text-align:center;margin:28px 0;">
          <a href="${params.reconfirmUrl}"
             style="background:#16a34a;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
            Reconfirm Now →
          </a>
        </div>
        <p style="color:#94a3b8;font-size:13px;line-height:1.5;">
          If you don't reconfirm by the due date, your listing${plural} will be temporarily hidden.
          You can reactivate within 30 days without losing your listing history.
        </p>
        <p style="color:#cbd5e1;font-size:12px;margin-top:24px;">— The SureLeads Team</p>
      </div>
    </div>
  `;

  await sendEmail({
    to:      params.agentEmail,
    subject: `Action Required: ${params.listings.length} listing${plural} need reconfirmation`,
    html,
  });
}

/**
 * Hidden notice — sent once on Day 7 when listing(s) are auto-hidden.
 * Explains grace period and how to reactivate.
 */
export async function sendReconfirmationHiddenEmail(params: {
  agentEmail:   string;
  agentName:    string;
  listings:     { title: string; hiddenAt: Date; graceExpiresAt: Date }[];
  reconfirmUrl: string;
}): Promise<void> {
  const listingRows = params.listings
    .map(
      (l) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #fef2f2;color:#1e293b;">${l.title}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #fef2f2;color:#dc2626;font-size:13px;">
            Reactivate by ${l.graceExpiresAt.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
          </td>
        </tr>`,
    )
    .join('');

  const plural = params.listings.length > 1 ? 's' : '';
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
      <div style="background:#dc2626;padding:24px 32px;">
        <h1 style="color:#fff;margin:0;font-size:20px;">🔴 Listing${plural} Hidden</h1>
        <p style="color:#fecaca;margin:6px 0 0;">SureLeads · Reactivate within 30 days</p>
      </div>
      <div style="padding:32px;">
        <p style="color:#1e293b;font-size:15px;">Hi ${params.agentName},</p>
        <p style="color:#475569;font-size:14px;line-height:1.6;">
          Your listing${plural} below ${params.listings.length > 1 ? 'have' : 'has'} been hidden because the weekly reconfirmation deadline was missed.
          <strong>You have 30 days to reactivate</strong> before ${params.listings.length > 1 ? 'they are' : 'it is'} permanently removed.
        </p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;border:1px solid #fee2e2;border-radius:8px;overflow:hidden;">
          <thead>
            <tr style="background:#fff5f5;">
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;">Listing</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;">Grace Period Expires</th>
            </tr>
          </thead>
          <tbody>${listingRows}</tbody>
        </table>
        <div style="text-align:center;margin:28px 0;">
          <a href="${params.reconfirmUrl}"
             style="background:#16a34a;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
            Reactivate Listings →
          </a>
        </div>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-top:8px;">
          <p style="color:#15803d;font-size:13px;margin:0;line-height:1.6;">
            <strong>What happens next:</strong> Once reactivated, your listing will be visible to tenants again immediately.
            Your listing history, photos, and description are all preserved.
          </p>
        </div>
        <p style="color:#cbd5e1;font-size:12px;margin-top:24px;">— The SureLeads Team</p>
      </div>
    </div>
  `;

  await sendEmail({
    to:      params.agentEmail,
    subject: `Urgent: ${params.listings.length} listing${plural} hidden — reactivate within 30 days`,
    html,
  });
}

export default getResend;
