import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from './jwt';
import type { JWTPayload, Role } from '@/types';

/* ─── Types ───────────────────────────────────────────── */

/** A NextRequest extended with the decoded JWT payload on `req.user`. */
export interface AuthenticatedRequest extends NextRequest {
  user: JWTPayload;
}

/* ─── withAuth — dual-signature ──────────────────────── */
//
// Supports two usage patterns:
//
// 1. HOC pattern (new, satisfies Next.js 14 route type constraints):
//      export const GET = withAuth(async (req: AuthenticatedRequest) => { ... }, ['AGENT']);
//
// 2. Legacy call-through pattern (used by existing routes):
//      export async function GET(req: NextRequest) {
//        return withAuth(req, ['AGENT'], async (user) => { ... });
//      }
//

// Overload 1 — HOC
export function withAuth(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (req: AuthenticatedRequest, ctx?: any) => Promise<NextResponse>,
  allowedRoles?: Role[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): (req: NextRequest, ctx?: any) => Promise<NextResponse>;

// Overload 2 — legacy call-through
export function withAuth(
  req: NextRequest,
  allowedRoles: Role[],
  handler: (user: JWTPayload) => Promise<NextResponse>,
): Promise<NextResponse>;

// Implementation
export function withAuth(
  reqOrHandler:
    | NextRequest
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | ((req: AuthenticatedRequest, ctx?: any) => Promise<NextResponse>),
  rolesOrRoles: Role[] | Role[] = [],
  legacyHandler?: (user: JWTPayload) => Promise<NextResponse>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): ((req: NextRequest, ctx?: any) => Promise<NextResponse>) | Promise<NextResponse> {

  /* ── HOC mode ── */
  if (typeof reqOrHandler === 'function') {
    const handler = reqOrHandler;
    const allowedRoles = Array.isArray(rolesOrRoles) ? rolesOrRoles : [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return async function routeHandler(req: NextRequest, ctx?: any): Promise<NextResponse> {
      return runAuth(req, allowedRoles, async (payload) => {
        const authedReq = Object.assign(req, { user: payload }) as AuthenticatedRequest;
        return handler(authedReq, ctx);
      });
    };
  }

  /* ── Legacy call-through mode ── */
  const req = reqOrHandler as NextRequest;
  const allowedRoles = Array.isArray(rolesOrRoles) ? rolesOrRoles : [];
  const handler = legacyHandler!;
  return runAuth(req, allowedRoles, handler);
}

/* ─── Shared auth logic ───────────────────────────────── */

async function runAuth(
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
