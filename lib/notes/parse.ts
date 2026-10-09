import type { GeneratedNote } from "@/lib/types";

/** Render a GeneratedNote to markdown for storage & export. */
export function toMarkdown(note: GeneratedNote): string {
  const lines: string[] = [];
  lines.push(`# ${note.title}`, "");
  if (note.summary) lines.push(`> ${note.summary}`, "");
  for (const s of note.sections) {
    lines.push(`## ${s.heading}`, "", s.body, "");
  }
  if (note.keyConcepts.length) {
    lines.push("## Key Concepts", "");
    for (const k of note.keyConcepts) lines.push(`- **${k.term}** — ${k.definition}`);
    lines.push("");
  }
  if (note.revisionQuestions.length) {
    lines.push("## Revision Questions", "");
    note.revisionQuestions.forEach((q, i) => lines.push(`${i + 1}. ${q}`));
    lines.push("");
  }
  if (note.unverified.length) {
    lines.push("## Unverified / Needs Checking", "");
    note.unverified.forEach((u) => lines.push(`- ${u}`));
    lines.push("");
  }
  return lines.join("\n").trim();
}
