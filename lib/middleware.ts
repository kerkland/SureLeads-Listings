import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from './jwt';
import type { JWTPayload, Role } from '@/types';

/**
 * Inline auth middleware.
 * Usage (all routes):
 *   return withAuth(req, ['ADMIN'], async (user) => { ... });
 *
 * Verifies the Bearer token, checks the role, then calls handler with the
 * decoded JWT payload. Returns 401/403 JSON on failure.
 */
export async function withAuth(
  req: NextRequest,
  allowedRoles: Role[],
  handler: (user: JWTPayload) => Promise<NextResponse>,
): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, error: 'Missing or invalid Authorization header' },
      { status: 401 },
    );
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyAccessToken(token);

    if (allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    return handler(payload);
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid or expired token' },
      { status: 401 },
    );
  }
}
