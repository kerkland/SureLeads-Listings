import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from './jwt';
import type { JWTPayload, Role } from '@/types';

export interface AuthenticatedRequest extends NextRequest {
  user: JWTPayload;
}

// Using unknown-indexed params to be compatible with all dynamic route patterns
type RouteHandler = (req: AuthenticatedRequest, ctx: { params: Record<string, string> }) => Promise<NextResponse>;

export function withAuth(handler: RouteHandler, allowedRoles?: Role[]) {
  return async (req: NextRequest, ctx: { params: Record<string, string> }) => {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid Authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    try {
      const payload = verifyAccessToken(token);

      if (allowedRoles && !allowedRoles.includes(payload.role)) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }

      (req as AuthenticatedRequest).user = payload;
      return handler(req as AuthenticatedRequest, ctx);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
  };
}
