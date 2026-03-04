/**
 * GET  /api/admin/settings  — read platform settings
 * PUT  /api/admin/settings  — write platform settings
 *
 * Settings are stored in data/settings.json at the project root.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import path from 'path';
import fs   from 'fs';
import { withAuth } from '@/lib/middleware';

const SETTINGS_PATH = path.join(process.cwd(), 'data', 'settings.json');

function readSettings() {
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

const settingsSchema = z.object({
  reconfirmationDays:       z.number().int().min(1).max(30).optional(),
  gracePeriodDays:          z.number().int().min(1).max(14).optional(),
  priceThresholdMultiplier: z.number().min(1).max(10).optional(),
  maxListingsPerTier: z.object({
    STARTER:      z.number().int().min(1).max(1000),
    PROFESSIONAL: z.number().int().min(1).max(1000),
    AGENCY:       z.number().int().min(1).max(1000),
  }).optional(),
  inspectionResponseHours: z.number().int().min(1).max(168).optional(),
  featuredAreas: z.array(z.string().min(1).max(100)).max(20).optional(),
});

export async function GET(req: NextRequest) {
  return withAuth(req, ['ADMIN'], async () => {
    const settings = readSettings();
    return NextResponse.json({ success: true, data: settings });
  });
}

export async function PUT(req: NextRequest) {
  return withAuth(req, ['ADMIN'], async () => {
    try {
      const body   = await req.json();
      const parsed = settingsSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.flatten().fieldErrors },
          { status: 400 },
        );
      }

      const current  = readSettings();
      const updated  = { ...current, ...parsed.data };

      // Ensure data dir exists
      const dir = path.dirname(SETTINGS_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      fs.writeFileSync(SETTINGS_PATH, JSON.stringify(updated, null, 2), 'utf-8');

      return NextResponse.json({ success: true, data: updated });
    } catch (err) {
      console.error('[PUT /api/admin/settings]', err);
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  });
}
