import PDFDocument from 'pdfkit';

export interface PDFDocumentOptions {
  title?: string;
  author?: string;
  subject?: string;
}

/**
 * Creates a standardized A4 PDFDocument with OpenSea ERP defaults.
 */
export function createPDFDocument(
  options?: PDFDocumentOptions,
): PDFKit.PDFDocument {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 40, bottom: 40, left: 50, right: 50 },
    info: {
      Title: options?.title || 'OpenSea Document',
      Author: options?.author || 'OpenSea ERP',
      Subject: options?.subject,
    },
    bufferPages: true,
  });
  return doc;
}

/**
 * Formats a number as BRL currency string (e.g. "R$ 1.234,56").
 */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formats a Date as "dd/mm/yyyy" in pt-BR locale.
 */
export function formatDateBR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR');
}

/**
 * Formats a Date as "mm/yyyy" for reference periods.
 */
export function formatMonthYear(month: number, year: number): string {
  return `${String(month).padStart(2, '0')}/${year}`;
}

/**
 * Masks a CPF: "123.456.789-00" -> "***.456.789-**"
 */
export function maskCPF(cpf: string): string {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return cpf;
  return `***.${clean.substring(3, 6)}.${clean.substring(6, 9)}-**`;
}

/**
 * Formats a CNPJ: "12345678000100" -> "12.345.678/0001-00"
 */
export function formatCNPJ(cnpj: string): string {
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length !== 14) return cnpj;
  return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Formats hours and minutes: { hours: 8, minutes: 30 } -> "08:30"
 */
export function formatHoursMinutes(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Formats total minutes as HH:MM string.
 */
export function formatMinutesToHHMM(totalMinutes: number): string {
  const sign = totalMinutes < 0 ? '-' : '';
  const absMinutes = Math.abs(totalMinutes);
  const hours = Math.floor(absMinutes / 60);
  const minutes = absMinutes % 60;
  return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// ─── PDF Drawing helpers ───────────────────────────────────────────────

const COLORS = {
  primary: '#1e293b', // slate-800
  secondary: '#64748b', // slate-500
  border: '#cbd5e1', // slate-300
  headerBg: '#f1f5f9', // slate-100
  white: '#ffffff',
  black: '#000000',
} as const;

export interface TableColumn {
  header: string;
  width: number;
  align?: 'left' | 'center' | 'right';
}

/**
 * Draws a horizontal line across the page content area.
 */
export function drawHorizontalLine(
  doc: PDFKit.PDFDocument,
  y: number,
  options?: { color?: string; lineWidth?: number },
): void {
  const { color = COLORS.border, lineWidth = 0.5 } = options ?? {};
  const pageWidth = doc.page.width;
  const margins = doc.page.margins;
  doc
    .strokeColor(color)
    .lineWidth(lineWidth)
    .moveTo(margins.left, y)
    .lineTo(pageWidth - margins.right, y)
    .stroke();
}

/**
 * Draws a section header with background.
 */
export function drawSectionHeader(
  doc: PDFKit.PDFDocument,
  text: string,
  y: number,
): number {
  const pageWidth = doc.page.width;
  const margins = doc.page.margins;
  const contentWidth = pageWidth - margins.left - margins.right;

  doc.rect(margins.left, y, contentWidth, 20).fill(COLORS.headerBg);

  doc
    .fillColor(COLORS.primary)
    .font('Helvetica-Bold')
    .fontSize(9)
    .text(text, margins.left + 5, y + 5, {
      width: contentWidth - 10,
    });

  return y + 20;
}

/**
 * Draws a table row with columns.
 */
export function drawTableRow(
  doc: PDFKit.PDFDocument,
  columns: TableColumn[],
  values: string[],
  y: number,
  options?: { bold?: boolean; fontSize?: number; height?: number },
): number {
  const { bold = false, fontSize = 8, height = 16 } = options ?? {};
  const margins = doc.page.margins;

  doc
    .fillColor(COLORS.primary)
    .font(bold ? 'Helvetica-Bold' : 'Helvetica')
    .fontSize(fontSize);

  let x = margins.left;
  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    const value = values[i] ?? '';
    const textOptions: PDFKit.Mixins.TextOptions = {
      width: col.width - 4,
      align: col.align ?? 'left',
      lineBreak: false,
    };
    doc.text(value, x + 2, y + 3, textOptions);
    x += col.width;
  }

  return y + height;
}

/**
 * Draws a table header row with border.
 */
export function drawTableHeader(
  doc: PDFKit.PDFDocument,
  columns: TableColumn[],
  y: number,
): number {
  const margins = doc.page.margins;
  const contentWidth = doc.page.width - margins.left - margins.right;

  // Background
  doc.rect(margins.left, y, contentWidth, 18).fill(COLORS.headerBg);

  // Border lines
  drawHorizontalLine(doc, y, { color: COLORS.primary, lineWidth: 0.5 });
  drawHorizontalLine(doc, y + 18, { color: COLORS.primary, lineWidth: 0.5 });

  // Vertical separators
  let x = margins.left;
  for (const col of columns) {
    doc
      .strokeColor(COLORS.primary)
      .lineWidth(0.3)
      .moveTo(x, y)
      .lineTo(x, y + 18)
      .stroke();
    x += col.width;
  }
  doc
    .strokeColor(COLORS.primary)
    .lineWidth(0.3)
    .moveTo(x, y)
    .lineTo(x, y + 18)
    .stroke();

  // Headers text
  doc.fillColor(COLORS.primary).font('Helvetica-Bold').fontSize(7.5);

  x = margins.left;
  for (const col of columns) {
    doc.text(col.header, x + 2, y + 5, {
      width: col.width - 4,
      align: col.align ?? 'left',
      lineBreak: false,
    });
    x += col.width;
  }

  return y + 18;
}

/**
 * Collects PDF buffer from a PDFDocument stream.
 */
export function collectPDFBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

export { COLORS as PDF_COLORS };
