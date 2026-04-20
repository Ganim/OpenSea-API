import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

/**
 * Pure pdfkit + qrcode rendering helpers for the Phase 5 crachá PDF surface
 * (Plan 05-06 Task 1).
 *
 * Keep this module free of repository / Prisma / env dependencies so it can
 * be unit-tested in isolation and shared between the sync individual use
 * case and the async badge-pdf worker.
 *
 * Physical unit: 1 mm = 2.8346 PostScript points. Cards follow the ID-1
 * credit-card size (85 × 54 mm). The A4 lote page packs 8 cards (2 cols ×
 * 4 rows) with 5 mm gutter + dashed 1 mm cut marks per UI-SPEC §Badge PDF
 * Layout Contract.
 */

const MM = 2.8346;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BadgeData {
  employeeId: string;
  fullName: string;
  socialName: string | null;
  registration: string;
  /** Absolute HTTP(S) URL or null; when null, we render an initials tile. */
  photoUrl: string | null;
  /** Plaintext QR payload (64-hex). Never persisted; comes fresh from rotate. */
  qrToken: string;
  tenantName: string;
  tenantLogoUrl: string | null;
  /** Hex string (e.g. `#2563EB`). Callers default to `#2563EB` when absent. */
  tenantBrandColor: string;
  rotatedAt: Date;
}

// ─── Individual 85×54mm badge ────────────────────────────────────────────────

/**
 * Renders a single ID-1 crachá (85×54mm) PDF. Layout per UI-SPEC:
 *   - 2mm brand-color stripe at the top
 *   - Photo (25×30mm) OR initials tile at left
 *   - Name block to the right of the photo
 *   - QR (30×30mm) at bottom-right
 *   - Footer line "Validade: rotacionado em dd/MM/yyyy"
 */
export async function renderIndividualBadge(data: BadgeData): Promise<Buffer> {
  const doc = new PDFDocument({
    size: [85 * MM, 54 * MM],
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    info: {
      Title: `Crachá ${data.registration}`,
      Author: 'OpenSea ERP',
    },
  });

  const collected = collect(doc);

  await renderCardInline(doc, data, 0, 0);

  doc.end();
  return collected;
}

// ─── A4 portrait sheet with 2×4 grid + cut marks ─────────────────────────────

/**
 * Renders an A4 portrait sheet packing up to 8 crachás per page (2 cols ×
 * 4 rows) with dashed cut marks at every card corner. Additional cards
 * overflow to subsequent pages. Empty input returns a minimal PDF.
 */
export async function renderA4BadgeSheet(cards: BadgeData[]): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A4',
    margins: {
      top: 15 * MM,
      bottom: 15 * MM,
      left: 22.5 * MM,
      right: 22.5 * MM,
    },
    info: {
      Title: 'Crachás OpenSea (A4 2×4)',
      Author: 'OpenSea ERP',
    },
    bufferPages: true,
  });

  const collected = collect(doc);

  const CARD_W = 85 * MM;
  const CARD_H = 54 * MM;
  const GUTTER = 5 * MM;
  const COLS = 2;
  const ROWS = 4;
  const PER_PAGE = COLS * ROWS;

  for (let i = 0; i < cards.length; i++) {
    if (i > 0 && i % PER_PAGE === 0) doc.addPage();
    const idx = i % PER_PAGE;
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    const x = 22.5 * MM + col * (CARD_W + GUTTER);
    const y = 15 * MM + row * (CARD_H + GUTTER);

    await renderCardInline(doc, cards[i], x, y);
    renderCutMarks(doc, x, y, CARD_W, CARD_H);
  }

  // Render a footer on every produced page. `bufferPages: true` + the
  // `switchToPage` API lets us iterate back and stamp once we know the
  // total. On an empty `cards` array we skip this block (no content page).
  if (cards.length > 0) {
    const range = doc.bufferedPageRange();
    for (let p = range.start; p < range.start + range.count; p++) {
      doc.switchToPage(p);
      doc
        .fontSize(8)
        .fillColor('#999999')
        .font('Helvetica')
        .text(
          `Rotação: ${formatDatePtBR(new Date())} · OpenSea · ${cards[0].tenantName}`,
          0,
          285 * MM,
          { align: 'center', width: 210 * MM },
        );
    }
  }

  doc.end();
  return collected;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

/**
 * Draws the crachá content block (photo/initials + name + QR + footer) into
 * the supplied pdfkit doc at the given top-left anchor. Shared between the
 * individual endpoint and the A4 lote worker so the visual contract stays
 * identical.
 */
async function renderCardInline(
  doc: PDFKit.PDFDocument,
  data: BadgeData,
  x: number,
  y: number,
): Promise<void> {
  // 2mm brand-color stripe across the top of the card.
  doc
    .save()
    .rect(x, y, 85 * MM, 2 * MM)
    .fill(normalizeHex(data.tenantBrandColor))
    .restore();

  // Photo or initials at x+3mm, y+15mm (25×30mm).
  const photoX = x + 3 * MM;
  const photoY = y + 15 * MM;
  const photoW = 25 * MM;
  const photoH = 30 * MM;

  let renderedPhoto = false;
  if (data.photoUrl) {
    try {
      const buf = await fetchImageBuffer(data.photoUrl);
      doc.image(buf, photoX, photoY, { width: photoW, height: photoH });
      renderedPhoto = true;
    } catch {
      // fall through to initials tile
    }
  }
  if (!renderedPhoto) {
    renderInitialsTile(doc, data.fullName, photoX, photoY, photoW, photoH);
  }

  // Name block at x+30mm, y+5mm.
  const nameX = x + 30 * MM;
  doc
    .fillColor('#111111')
    .font('Helvetica-Bold')
    .fontSize(13)
    .text(data.fullName, nameX, y + 5 * MM, {
      width: 52 * MM,
      lineBreak: true,
      ellipsis: true,
    });
  if (data.socialName) {
    doc
      .fillColor('#444444')
      .font('Helvetica')
      .fontSize(9)
      .text(data.socialName, nameX, y + 16 * MM, { width: 52 * MM });
  }
  doc
    .fillColor('#111111')
    .font('Helvetica')
    .fontSize(9)
    .text(`Matrícula ${data.registration}`, nameX, y + 22 * MM, {
      width: 52 * MM,
    });

  // QR (30×30mm) at bottom-right.
  const qrDataUrl = await QRCode.toDataURL(data.qrToken, {
    errorCorrectionLevel: 'H',
    margin: 0,
    width: 300,
  });
  doc.image(qrDataUrl, x + 52 * MM, y + 21 * MM, {
    width: 30 * MM,
    height: 30 * MM,
  });

  // Footer line.
  doc
    .fillColor('#555555')
    .font('Helvetica-Oblique')
    .fontSize(6.5)
    .text(
      `Validade: rotacionado em ${formatDatePtBR(data.rotatedAt)}`,
      x + 3 * MM,
      y + 49 * MM,
      { width: 82 * MM },
    );
}

/**
 * Draws 2 dashed segments (5mm long) at each of the 4 card corners (total
 * 8 segments). Dash pattern `[3 3] 0 d` at 0.2pt grey stroke.
 */
function renderCutMarks(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const L = 5 * MM;
  doc.save();
  doc.dash(3, { space: 3 }).lineWidth(0.2).strokeColor('#999999');

  // Top-left
  doc
    .moveTo(x - L, y)
    .lineTo(x, y)
    .stroke();
  doc
    .moveTo(x, y - L)
    .lineTo(x, y)
    .stroke();
  // Top-right
  doc
    .moveTo(x + w + L, y)
    .lineTo(x + w, y)
    .stroke();
  doc
    .moveTo(x + w, y - L)
    .lineTo(x + w, y)
    .stroke();
  // Bottom-left
  doc
    .moveTo(x - L, y + h)
    .lineTo(x, y + h)
    .stroke();
  doc
    .moveTo(x, y + h + L)
    .lineTo(x, y + h)
    .stroke();
  // Bottom-right
  doc
    .moveTo(x + w + L, y + h)
    .lineTo(x + w, y + h)
    .stroke();
  doc
    .moveTo(x + w, y + h + L)
    .lineTo(x + w, y + h)
    .stroke();

  doc.restore();
}

function renderInitialsTile(
  doc: PDFKit.PDFDocument,
  fullName: string,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const initials = extractInitials(fullName);
  doc.save();
  doc.rect(x, y, w, h).fill('#E2E8F0'); // slate-200 tile background
  doc
    .fillColor('#1E293B') // slate-800
    .font('Helvetica-Bold')
    .fontSize(28)
    .text(initials, x, y + h / 2 - 14, { width: w, align: 'center' });
  doc.restore();
}

function extractInitials(fullName: string): string {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 0);
  if (parts.length === 0) return '?';
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return (first + last).toUpperCase();
}

function normalizeHex(color: string): string {
  // Accept `#RRGGBB` or `RRGGBB`. Fallback to project default if malformed.
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color;
  if (/^[0-9a-fA-F]{6}$/.test(color)) return `#${color}`;
  return '#2563EB';
}

function formatDatePtBR(d: Date): string {
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

async function fetchImageBuffer(url: string): Promise<Buffer> {
  // Node 20+ has global fetch; no polyfill needed. 5s timeout via AbortSignal.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`Image fetch HTTP ${res.status}`);
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  } finally {
    clearTimeout(timer);
  }
}

function collect(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}
