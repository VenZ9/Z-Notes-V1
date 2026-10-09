import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let _sql: NeonQueryFunction<false, false> | null = null;

function getClient() {
  if (_sql) return _sql;
  const url = process.env.ZNOTES_DATABASE_URL;
  if (!url) {
    throw new Error(
      "ZNOTE_DATABASE_URL is not set. Add it in Vercel → Project → Settings → Environment Variables.",
    );
  }
  _sql = neon(url);
  return _sql;
}

export const sql: NeonQueryFunction<false, false> = new Proxy(
  (() => {}) as unknown as NeonQueryFunction<false, false>,
  {
    apply(_target, _thisArg, args) {
      // @ts-expect-error — dynamic invocation of the lazy client
      return (getClient() as any)(...args);
    },
    get(_target, prop) {
      const client = getClient() as any;
      const value = client[prop];
      return typeof value === "function" ? value.bind(client) : value;
    },
  },
);

export async function ensureSchema() {
  const db = getClient();
  await db`
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
  await db`
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
  await db`
    CREATE TABLE IF NOT EXISTS preferences (
      key   TEXT PRIMARY KEY,
      value JSONB NOT NULL
    )
  `;
  await db`CREATE INDEX IF NOT EXISTS notes_updated_idx ON notes (updated_at DESC)`;
  await db`CREATE INDEX IF NOT EXISTS history_created_idx ON history (created_at DESC)`;
}
