import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAccess } from "@/lib/guard";

const DEFAULTS = {
  theme: "system",
  defaultUseResearch: true,
  defaultTemperature: 0.2,
};

export async function GET(req: NextRequest) {
  const denied = requireAccess(req);
  if (denied) return denied;
  const rows = await sql`SELECT key, value FROM preferences`;
  const out: Record<string, any> = { ...DEFAULTS };
  for (const r of rows as any[]) out[r.key] = r.value;
  return NextResponse.json({ settings: out });
}

export async function PUT(req: NextRequest) {
  const denied = requireAccess(req);
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const entries = Object.entries(body || {});
  for (const [key, value] of entries) {
    await sql`
      INSERT INTO preferences (key, value) VALUES (${key}, ${JSON.stringify(value)}::jsonb)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `;
  }
  const rows = await sql`SELECT key, value FROM preferences`;
  const out: Record<string, any> = { ...DEFAULTS };
  for (const r of rows as any[]) out[r.key] = r.value;
  return NextResponse.json({ settings: out });
    }
