import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '@/lib/db';
import { generateTokenPair } from '@/lib/jwt';
import redis from '@/lib/redis';

const registerSchema = z.object({
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number'),
  email: z.string().email().optional(),
  fullName: z.string().min(2).max(100),
  password: z.string().min(8),
  role: z.enum(['AGENT', 'CLIENT']).default('CLIENT'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { phone, email, fullName, password, role } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Phone number already registered' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { phone, email, fullName, passwordHash, role },
      select: { id: true, phone: true, email: true, fullName: true, role: true, isVerified: true },
    });

    const tokens = generateTokenPair({ sub: user.id, phone: user.phone, role: user.role });

    // Store refresh token in Redis (30 days TTL)
    await redis.setex(`refresh:${user.id}`, 30 * 24 * 3600, tokens.refreshToken);

    const response = NextResponse.json(
      { success: true, data: { user, accessToken: tokens.accessToken } },
      { status: 201 }
    );

    // Set refresh token as httpOnly cookie
    response.cookies.set('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 3600,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('[register]', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
