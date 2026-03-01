import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '@/lib/db';
import { generateTokenPair } from '@/lib/jwt';
import redis from '@/lib/redis';

const loginSchema = z.object({
  phone: z.string(),
  password: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { phone, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { phone, deletedAt: null },
      select: {
        id: true,
        phone: true,
        email: true,
        fullName: true,
        role: true,
        isVerified: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone or password' },
        { status: 401 }
      );
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone or password' },
        { status: 401 }
      );
    }

    const tokens = generateTokenPair({ sub: user.id, phone: user.phone, role: user.role });
    await redis.setex(`refresh:${user.id}`, 30 * 24 * 3600, tokens.refreshToken);

    const { passwordHash: _ph, ...safeUser } = user; // _ph intentionally unused

    const response = NextResponse.json({
      success: true,
      data: { user: safeUser, accessToken: tokens.accessToken },
    });

    response.cookies.set('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 3600,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('[login]', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
