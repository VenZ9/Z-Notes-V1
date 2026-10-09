import { NextRequest, NextResponse } from "next/server";
import { providerStatus } from "@/lib/providers";
import { researchConfigured } from "@/lib/research/tavily";
import { requireAccess } from "@/lib/guard";

export async function GET(req: NextRequest) {
  const denied = requireAccess(req);
  if (denied) return denied;
  return NextResponse.json({
    providers: providerStatus(),
    priority: (process.env.PROVIDER_PRIORITY || "groq,gemini,kilo").split(",").map((s) => s.trim()),
    research: { configured: researchConfigured() },
  });
}
