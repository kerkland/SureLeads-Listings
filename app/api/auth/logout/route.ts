import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken } from '@/lib/jwt';
import redis from '@/lib/redis';

export async function POST(req: NextRequest) {
  try {
    const cookieToken = req.cookies.get('refreshToken')?.value;

    if (cookieToken) {
      try {
        const payload = verifyRefreshToken(cookieToken);
        await redis.del(`refresh:${payload.sub}`);
      } catch {
        // Token invalid — still clear cookie
      }
    }

    const response = NextResponse.json({ success: true, message: 'Logged out' });
    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    return response;
  } catch (err) {
    console.error('[logout]', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
