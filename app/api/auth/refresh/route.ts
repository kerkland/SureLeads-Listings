import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, generateTokenPair } from '@/lib/jwt';
import redis from '@/lib/redis';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const cookieToken = req.cookies.get('refreshToken')?.value;
    if (!cookieToken) {
      return NextResponse.json({ success: false, error: 'No refresh token' }, { status: 401 });
    }

    let payload;
    try {
      payload = verifyRefreshToken(cookieToken);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // Validate token still matches stored token (rotation check)
    const stored = await redis.get(`refresh:${payload.sub}`);
    if (stored !== cookieToken) {
      return NextResponse.json(
        { success: false, error: 'Refresh token revoked' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub, deletedAt: null },
      select: { id: true, phone: true, role: true },
    });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 });
    }

    const tokens = generateTokenPair({ sub: user.id, phone: user.phone, role: user.role });
    await redis.setex(`refresh:${user.id}`, 30 * 24 * 3600, tokens.refreshToken);

    const response = NextResponse.json({
      success: true,
      data: { accessToken: tokens.accessToken },
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
    console.error('[refresh]', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
