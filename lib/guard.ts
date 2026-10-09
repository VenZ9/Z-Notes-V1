import { NextRequest, NextResponse } from "next/server";

/**
 * Lightweight access guard for a PRIVATE deployment.
 * This is NOT authentication — it is a shared-secret gate so that a
 * private deployment's API routes (which hold server-side provider keys)
 * cannot be hit by strangers who discover the URL.
 *
 * If ZNOTES_ACCESS_KEY is unset, the app is fully open. In that case,
 * rely on Vercel Deployment Protection or a private network.
 */
export function requireAccess(req: NextRequest): NextResponse | null {
  const expected = process.env.ZNOTES_ACCESS_KEY;
  if (!expected) return null; // open (private deployment)

  const header = req.headers.get("x-znotes-key");
  const query = req.nextUrl.searchParams.get("key");
  if (header === expected || query === expected) return null;

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
