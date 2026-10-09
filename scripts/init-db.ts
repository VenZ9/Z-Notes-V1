import { ensureSchema } from "../lib/db";

ensureSchema()
  .then(() => { console.log("Schema ready."); process.exit(0); })
  .catch((e) => { console.error(e); process.exit(1); });
