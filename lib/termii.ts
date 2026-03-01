import axios from 'axios';

const TERMII_BASE = 'https://v3.api.termii.com/api';

export async function sendSms(to: string, message: string): Promise<void> {
  await axios.post(`${TERMII_BASE}/sms/send`, {
    api_key: process.env.TERMII_API_KEY,
    from: process.env.TERMII_SENDER_ID ?? 'Prop',
    to,
    sms: message,
    type: 'plain',
    channel: 'generic',
  });
}

export async function sendOtpSms(phone: string, otp: string): Promise<void> {
  const message = `Your Prop verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`;
  await sendSms(phone, message);
}
