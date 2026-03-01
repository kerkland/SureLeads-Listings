import prisma from './db';
import { sendSms } from './termii';
import { sendEmail } from './resend';
import type { NotificationChannel } from '@/types';

interface NotifyParams {
  userId: string;
  type: string;
  title: string;
  body: string;
  channel: NotificationChannel;
  phone?: string;
  email?: string;
}

/**
 * Unified notification dispatcher.
 * Always creates an in-app notification; also sends SMS/email as requested.
 */
export async function notifyUser(params: NotifyParams): Promise<void> {
  const { userId, type, title, body, channel, phone, email } = params;

  // Always save in-app notification
  await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      channel: 'IN_APP',
      sentAt: new Date(),
    },
  });

  try {
    if (channel === 'SMS' || channel === 'IN_APP') {
      // Fetch phone if not provided
      let recipientPhone = phone;
      if (!recipientPhone) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { phone: true },
        });
        recipientPhone = user?.phone;
      }
      if (recipientPhone) {
        await sendSms(recipientPhone, `${title}: ${body}`);
        await prisma.notification.create({
          data: { userId, type, title, body, channel: 'SMS', sentAt: new Date() },
        });
      }
    }

    if (channel === 'EMAIL') {
      let recipientEmail = email;
      if (!recipientEmail) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true },
        });
        recipientEmail = user?.email ?? undefined;
      }
      if (recipientEmail) {
        await sendEmail({
          to: recipientEmail,
          subject: title,
          html: `<p>${body}</p>`,
        });
        await prisma.notification.create({
          data: { userId, type, title, body, channel: 'EMAIL', sentAt: new Date() },
        });
      }
    }
  } catch (err) {
    console.error('[notificationService] Delivery failed:', err);
    // Don't throw — notification is already saved in-app
  }
}

export async function notifyBoth(params: {
  agentId: string;
  clientId: string;
  type: string;
  title: string;
  body: string;
}): Promise<void> {
  await Promise.all([
    notifyUser({ userId: params.agentId, type: params.type, title: params.title, body: params.body, channel: 'SMS' }),
    notifyUser({ userId: params.clientId, type: params.type, title: params.title, body: params.body, channel: 'SMS' }),
  ]);
}

export async function notifyCrossPostFlag(agentId: string, listingTitle: string) {
  await notifyUser({
    userId: agentId,
    type: 'CROSS_POST_FLAG',
    title: 'Cross-posting Alert',
    body: `Your listing "${listingTitle}" may be duplicated. Resolve within 48 hours.`,
    channel: 'SMS',
  });
}
