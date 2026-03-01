import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyOtp } from '@/lib/otp';
import prisma from '@/lib/db';

const schema = z.object({
  phone: z.string().regex(/^\+?[0-9]{10,15}$/),
  otp: z.string().length(6),
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

    const { phone, otp } = parsed.data;
    const valid = await verifyOtp(phone, otp);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Mark user as verified
    await prisma.user.updateMany({
      where: { phone, deletedAt: null },
      data: { isVerified: true },
    });

    return NextResponse.json({ success: true, message: 'Phone verified' });
  } catch (err) {
    console.error('[otp/verify]', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
