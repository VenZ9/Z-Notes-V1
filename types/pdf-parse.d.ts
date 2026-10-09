declare module "pdf-parse" {
  interface PDFParseResult {
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: unknown;
    version: string;
    text: string;
  }

  interface PDFParseOptions {
    max?: number;
    version?: string;
    pagerender?: (pageData: unknown) => string | Promise<string>;
  }

  function pdfParse(
    dataBuffer: Buffer | Uint8Array,
    options?: PDFParseOptions,
  ): Promise<PDFParseResult>;

  export default pdfParse;
}
