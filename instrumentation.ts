export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!process.env.ZNOTES_DATABASE_URL) {
    console.warn(
      "[z-notes] ZNOTES_DATABASE_URL is not set — routes that touch the DB will fail.",
    );
    return;
  }
  try {
    const { ensureSchema } = await import("./lib/db");
    await ensureSchema();
    console.log("[z-notes] Schema ready.");
  } catch (e) {
    console.error("[z-notes] Schema init failed:", e);
  }
}
