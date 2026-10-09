import { NextRequest, NextResponse } from "next/server";
import { extractFile } from "@/lib/extract";
import { requireAccess } from "@/lib/guard";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const denied = requireAccess(req);
  if (denied) return denied;

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "file field is required" }, { status: 400 });

  try {
    const out = await extractFile(file);
    const text = out.text.trim();
    if (!text) return NextResponse.json({ error: "No extractable text found in file." }, { status: 422 });
    return NextResponse.json({ text: text.slice(0, 40000), kind: out.kind, bytes: out.bytes, truncated: text.length > 40000 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
