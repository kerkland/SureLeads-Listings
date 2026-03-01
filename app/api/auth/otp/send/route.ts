import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateOtp, storeOtp } from '@/lib/otp';
import { sendOtpSms } from '@/lib/termii';

const schema = z.object({
  phone: z.string().regex(/^\+?[0-9]{10,15}$/),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { phone } = parsed.data;
    const otp = generateOtp();
    await storeOtp(phone, otp);

    try {
      await sendOtpSms(phone, otp);
    } catch (smsErr) {
      console.error('[otp/send] SMS failed:', smsErr);
      // Don't expose SMS failure — OTP is still stored
    }

    return NextResponse.json({ success: true, message: 'OTP sent' });
  } catch (err) {
    console.error('[otp/send]', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
