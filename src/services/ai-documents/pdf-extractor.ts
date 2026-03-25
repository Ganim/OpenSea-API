import { PDFParse } from 'pdf-parse';

const MAX_DOCUMENT_CHARS = 30_000;

/**
 * Extracts text content from a PDF buffer using pdf-parse v2.
 * Truncates output to MAX_DOCUMENT_CHARS to avoid overwhelming the AI.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  let parser: PDFParse | null = null;

  try {
    parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const text = result.text?.trim();

    if (!text || text.length === 0) {
      throw new Error('O PDF não contém texto extraível.');
    }

    if (text.length > MAX_DOCUMENT_CHARS) {
      return (
        text.slice(0, MAX_DOCUMENT_CHARS) + '\n\n[... documento truncado ...]'
      );
    }

    return text;
  } catch (error) {
    if (error instanceof Error && error.message.includes('não contém texto')) {
      throw error;
    }
    throw new Error(
      `Falha ao extrair texto do PDF: ${error instanceof Error ? error.message : 'erro desconhecido'}`,
    );
  } finally {
    if (parser) {
      await parser.destroy().catch(() => {});
    }
  }
}

/**
 * Truncates raw text content to a safe size for AI processing.
 */
export function truncateContent(content: string): string {
  if (content.length <= MAX_DOCUMENT_CHARS) {
    return content;
  }
  return (
    content.slice(0, MAX_DOCUMENT_CHARS) + '\n\n[... documento truncado ...]'
  );
}
