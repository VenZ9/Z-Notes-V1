import { NextRequest, NextResponse } from "next/server";
import { webSearch, researchConfigured } from "@/lib/research/tavily";
import { rankSources } from "@/lib/research/rank";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";
import { requireAccess } from "@/lib/guard";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const denied = requireAccess(req);
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const query = String(body?.query || "").trim();
  if (!query) return NextResponse.json({ error: "query is required" }, { status: 400 });
  if (!researchConfigured()) {
    return NextResponse.json({ error: "TAVILY_API_KEY is not configured — research unavailable." }, { status: 503 });
  }
  try {
    const sources = rankSources(await webSearch(query, 8));
    await sql`
      INSERT INTO history (id,kind,input,ok,meta)
      VALUES (${randomUUID()},'research',${query},true,
              ${JSON.stringify({ sourceCount: sources.length })}::jsonb)
    `;
    return NextResponse.json({ sources });
  } catch (e) {
    const msg = (e as Error).message;
    await sql`
      INSERT INTO history (id,kind,input,ok,error,meta)
      VALUES (${randomUUID()},'research',${query},false,${msg},'{}'::jsonb)
    `.catch(() => {});
    return NextResponse.json({ error: msg }, { status: 502 });
  }
      }
