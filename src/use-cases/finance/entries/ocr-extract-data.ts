import Tesseract from 'tesseract.js';
import { BoletoBarcode } from '@/entities/finance';

// ============================================================================
// TYPES
// ============================================================================

interface OcrExtractFromBuffer {
  buffer: Buffer;
  mimeType: string;
  tenantId: string;
}

interface OcrExtractFromText {
  text: string;
  tenantId: string;
}

type OcrExtractDataUseCaseRequest = OcrExtractFromBuffer | OcrExtractFromText;

export interface OcrExtractedData {
  valor?: number;
  vencimento?: string; // ISO date string yyyy-mm-dd
  beneficiario?: string;
  codigoBarras?: string;
  linhaDigitavel?: string;
}

export interface OcrExtractResult {
  rawText: string;
  extractedData: OcrExtractedData;
  confidence: number;
}

// ============================================================================
// REGEX PATTERNS
// ============================================================================

function extractValor(text: string): number | undefined {
  // Match R$ followed by value: R$ 1.250,00 or R$500,50
  const patterns = [
    /R\$\s*([\d.]+,\d{2})/i,
    /valor[^:]*:\s*R?\$?\s*([\d.]+,\d{2})/i,
    /total[^:]*:\s*R?\$?\s*([\d.]+,\d{2})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const raw = match[1].replace(/\./g, '').replace(',', '.');
      const value = parseFloat(raw);
      if (!isNaN(value) && value > 0) return value;
    }
  }

  return undefined;
}

function extractVencimento(text: string): string | undefined {
  // Match dd/mm/yyyy
  const patterns = [
    /vencimento[^:]*:\s*(\d{2}\/\d{2}\/\d{4})/i,
    /data[^:]*vencimento[^:]*:\s*(\d{2}\/\d{2}\/\d{4})/i,
    /(\d{2}\/\d{2}\/\d{4})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const [day, month, year] = match[1].split('/');
      const d = parseInt(day, 10);
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);

      if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 2020 && y <= 2099) {
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
  }

  return undefined;
}

function extractBeneficiario(text: string): string | undefined {
  const patterns = [/(?:benefici[aá]rio|cedente)\s*:\s*(.+)/i];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Clean: remove CNPJ, trailing spaces, and limit to reasonable length
      let name = match[1].trim();
      // Remove CNPJ/CPF patterns that may follow
      name = name
        .replace(/\s*[-–]\s*\d{2,3}\.?\d{3}\.?\d{3}[/.]?\d{4}[-.]?\d{2}.*$/, '')
        .trim();
      // Remove trailing whitespace and line break content
      name = name.split('\n')[0].trim();
      if (name.length > 0 && name.length <= 256) {
        return name;
      }
    }
  }

  return undefined;
}

function extractLinhaDigitavel(text: string): string | undefined {
  // Linha digitavel is 47 digits, may contain dots, spaces, dashes
  const cleaned = text.replace(/[^\d\s.]/g, ' ');
  // Find sequences of digits that total 47 when dots/spaces removed
  const match = cleaned.match(
    /(\d{5}[.\s]?\d{5}[.\s]?\d{5}[.\s]?\d{6}[.\s]?\d{5}[.\s]?\d{6}[.\s]?\d{1}[.\s]?\d{14})/,
  );

  if (match) {
    const digits = match[1].replace(/\D/g, '');
    if (digits.length === 47) {
      return match[1].trim();
    }
  }

  // Fallback: look for any 47 consecutive digits
  const _fallbackMatch = text.replace(/\D/g, ' ').split(/\s+/).join('');
  // Search for 47-digit sequences in the cleaned numeric text
  const numericBlocks = text.match(/[\d.\s-]{40,70}/g);
  if (numericBlocks) {
    for (const block of numericBlocks) {
      const digits = block.replace(/\D/g, '');
      if (digits.length === 47) {
        return block.trim();
      }
    }
  }

  return undefined;
}

function extractCodigoBarras(text: string): string | undefined {
  // Barcode is 44 digits
  const numericBlocks = text.match(/\d{44,}/g);
  if (numericBlocks) {
    for (const block of numericBlocks) {
      if (block.length === 44) {
        // Validate with BoletoBarcode
        const parsed = BoletoBarcode.fromBarcode(block);
        if (parsed) return block;
      }
    }
  }

  return undefined;
}

function parseFinancialText(text: string): OcrExtractedData {
  const data: OcrExtractedData = {};

  data.valor = extractValor(text);
  data.vencimento = extractVencimento(text);
  data.beneficiario = extractBeneficiario(text);
  data.linhaDigitavel = extractLinhaDigitavel(text);
  data.codigoBarras = extractCodigoBarras(text);

  // If we found a linha digitavel, try to parse it for additional info
  if (data.linhaDigitavel) {
    const digits = data.linhaDigitavel.replace(/\D/g, '');
    const parsed = BoletoBarcode.fromDigitLine(digits);
    if (parsed) {
      const result = parsed.toResult();
      if (!data.valor && result.amount > 0) data.valor = result.amount;
      if (!data.vencimento && result.dueDate) {
        data.vencimento = result.dueDate.toISOString().split('T')[0];
      }
      if (!data.codigoBarras) data.codigoBarras = result.barcode;
    }
  }

  // Clean undefined values
  for (const key of Object.keys(data) as (keyof OcrExtractedData)[]) {
    if (data[key] === undefined) delete data[key];
  }

  return data;
}

// ============================================================================
// USE CASE
// ============================================================================

export class OcrExtractDataUseCase {
  async execute(
    request: OcrExtractDataUseCaseRequest,
  ): Promise<OcrExtractResult> {
    // Text mode: direct regex parsing
    if ('text' in request) {
      const extractedData = parseFinancialText(request.text);
      return {
        rawText: request.text,
        extractedData,
        confidence: 1.0,
      };
    }

    // Buffer mode: OCR with Tesseract or PDF text extraction
    const { buffer, mimeType } = request;

    if (mimeType === 'application/pdf') {
      return this.handlePdf(buffer);
    }

    // Image OCR
    return this.handleImage(buffer);
  }

  private async handlePdf(buffer: Buffer): Promise<OcrExtractResult> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse') as (
      buf: Buffer,
    ) => Promise<{ text: string }>;

    const pdfData = await pdfParse(buffer);
    const text = pdfData.text;

    if (text && text.trim().length > 10) {
      // Text-based PDF, parse directly
      const extractedData = parseFinancialText(text);
      return {
        rawText: text,
        extractedData,
        confidence: 1.0,
      };
    }

    // Scanned PDF with no text - would need image conversion
    // For now, return empty result
    return {
      rawText: '',
      extractedData: {},
      confidence: 0,
    };
  }

  private async handleImage(buffer: Buffer): Promise<OcrExtractResult> {
    const {
      data: { text, confidence },
    } = await Tesseract.recognize(buffer, 'por');

    const extractedData = parseFinancialText(text);

    return {
      rawText: text,
      extractedData,
      confidence: (confidence ?? 0) / 100, // Tesseract returns 0-100
    };
  }
}
