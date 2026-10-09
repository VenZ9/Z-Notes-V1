import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Add it in Vercel → Storage → Neon.");
}

export const sql = neon(process.env.DATABASE_URL);

export async function ensureSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS notes (
      id            TEXT PRIMARY KEY,
      title         TEXT NOT NULL,
      topic         TEXT NOT NULL,
      content       TEXT NOT NULL,
      sources       JSONB NOT NULL DEFAULT '[]'::jsonb,
      provider      TEXT,
      model         TEXT,
      status        TEXT NOT NULL DEFAULT 'draft',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS history (
      id            TEXT PRIMARY KEY,
      kind          TEXT NOT NULL,
      input         TEXT NOT NULL,
      provider      TEXT,
      ok            BOOLEAN NOT NULL,
      error         TEXT,
      meta          JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS preferences (
      key   TEXT PRIMARY KEY,
      value JSONB NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS notes_updated_idx ON notes (updated_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS history_created_idx ON history (created_at DESC)`;
}
