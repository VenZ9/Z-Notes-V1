const MAX_BYTES = Number(process.env.MAX_UPLOAD_MB || 5) * 1024 * 1024;

const TEXT_TYPES = ["text/plain", "text/markdown", "text/csv", "application/json"];
const DOCX_TYPES = ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const PDF_TYPES = ["application/pdf"];

export type Extracted = { text: string; kind: string; bytes: number };

export async function extractFile(file: File): Promise<Extracted> {
  if (file.size > MAX_BYTES) {
    throw new Error(`File too large. Max ${process.env.MAX_UPLOAD_MB || 5} MB.`);
  }

  const type = file.type || "";
  const name = file.name || "upload";

  if (TEXT_TYPES.includes(type) || /\.(txt|md|csv|json)$/i.test(name)) {
    return { text: await file.text(), kind: "text", bytes: file.size };
  }

  if (DOCX_TYPES.includes(type) || /\.docx$/i.test(name)) {
    const mammoth = await import("mammoth");
    const buf = Buffer.from(await file.arrayBuffer());
    const out = await mammoth.extractRawText({ buffer: buf });
    return { text: out.value, kind: "docx", bytes: file.size };
  }

  if (PDF_TYPES.includes(type) || /\.pdf$/i.test(name)) {
    // pdf-parse is a CommonJS module
    const pdfParse = (await import("pdf-parse")).default as any;
    const buf = Buffer.from(await file.arrayBuffer());
    const out = await pdfParse(buf);
    return { text: out.text, kind: "pdf", bytes: file.size };
  }

  throw new Error(`Unsupported file type: ${type || name}. Allowed: txt, md, csv, json, docx, pdf.`);
}
