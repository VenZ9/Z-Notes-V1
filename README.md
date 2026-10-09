# Z-Notes

Private, single-user AI notes app. Generates structured, source-cited notes using
three configurable LLM providers with real backend failover, and real web search
via Tavily.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Vercel Postgres (Neon) for notes, history, preferences
- Groq → Gemini → Kilo failover (OpenAI-compatible adapters)
- Tavily for real web search

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in keys.
3. Provision a database:
   - Vercel dashboard → Storage → Create → Neon (Postgres)
   - `vercel env pull .env.development.local`
   - Run the DDL once: `npm run db:init` (or paste `lib/schema.ts` SQL into the
     Neon SQL editor).
4. `npm run dev`

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `GROQ_API_KEY` | one of three | Groq provider |
| `GROQ_MODEL` | no | default `llama-3.3-70b-versatile` |
| `GEMINI_API_KEY` | one of three | Google Gemini provider |
| `GEMINI_MODEL` | no | default `gemini-3.8-flash` (exact ID required) |
| `KILO_API_KEY` | one of three | Kilo AI Gateway |
| `KILO_MODEL` | no | default `anthropic/claude-sonnet-4.5` |
| `PROVIDER_PRIORITY` | no | default `groq,gemini,kilo` |
| `TAVILY_API_KEY` | recommended | real web search |
| `DATABASE_URL` | yes | Vercel Postgres / Neon |
| `ZNOTES_ACCESS_KEY` | no | shared-secret gate for private deploys |
| `MAX_UPLOAD_MB` | no | default `5` |
| `REQUEST_TIMEOUT_MS` | no | default `60000` |

## Deploy to Vercel

1. Push the repo to GitHub.
2. Import into Vercel.
3. Add all env vars in **Project → Settings → Environment Variables**.
4. Attach Neon Postgres from the Vercel Storage tab (`DATABASE_URL` is injected).
5. Deploy.

For a truly private deployment, enable **Vercel Deployment Protection** (password
or Vercel Authentication) and/or set `ZNOTES_ACCESS_KEY`.

## Failover

`lib/providers/index.ts` tries providers in `PROVIDER_PRIORITY` order. It retries
retryable errors (rate limit, timeout, 5xx, model unavailable) once with backoff,
then moves to the next provider. Permanent errors (auth, bad request) do not loop.
The original messages, research context, and generation settings are passed
unchanged on every attempt.

If **all** providers fail, the API returns a clear error listing every attempt;
the user's input and uploaded material are preserved in the UI.

## Research integrity

- Sources are only ever what Tavily returns. Nothing is invented.
- The LLM is instructed to cite only provided source IDs and to list unsupported
  claims under **Unverified / Needs Checking**.
- If `TAVILY_API_KEY` is missing, the UI states clearly that facts could not be
  verified.

## Model note

`GEMINI_MODEL` defaults to the requested `gemini-3.8-flash`. This model ID was
verified as generally available via Google's OpenAI-compatible endpoint. The
Gemini adapter raises an explicit `model_unavailable` error if the ID ever stops
resolving, rather than silently substituting a different model.
