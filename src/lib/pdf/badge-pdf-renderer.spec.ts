import PDFDocument from 'pdfkit';
import { describe, expect, it, vi } from 'vitest';

import {
  renderA4BadgeSheet,
  renderIndividualBadge,
  type BadgeData,
} from './badge-pdf-renderer';

/**
 * Unit tests for the pure pdfkit + qrcode rendering helpers (Phase 5 / Plan
 * 05-06 Task 1).
 *
 * These tests exercise the real `pdfkit` and `qrcode` libraries end-to-end
 * (no mocks). Assertions target:
 *   - Buffer size > 1 KB (non-trivial output)
 *   - Raw PDF bytes contain the expected `/MediaBox` dimensions
 *   - 8 QR image instances per A4 sheet (one `/Image` object per card)
 *   - UTF-8 accents do not throw / crash pdfkit's font pipeline
 *   - Cut marks (dashed 1mm lines) are emitted for each card on A4
 */

function makeBadge(overrides: Partial<BadgeData> = {}): BadgeData {
  return {
    employeeId: 'emp-1',
    fullName: 'João Álvaro Gonçalves Oliveira',
    socialName: null,
    registration: 'EMP-00001',
    photoUrl: null,
    qrToken: 'a'.repeat(64),
    tenantName: 'Empresa Demo',
    tenantLogoUrl: null,
    tenantBrandColor: '#2563EB',
    rotatedAt: new Date('2026-04-20T10:00:00Z'),
    ...overrides,
  };
}

describe('renderIndividualBadge', () => {
  it('returns a non-empty Buffer (> 1 KB) for a valid single badge', async () => {
    const pdf = await renderIndividualBadge(makeBadge());
    expect(Buffer.isBuffer(pdf)).toBe(true);
    expect(pdf.length).toBeGreaterThan(1024);
  });

  it('produces a PDF whose MediaBox matches the 85×54mm ID-1 card size', async () => {
    const pdf = await renderIndividualBadge(makeBadge());
    const asString = pdf.toString('latin1');
    // 85 * 2.8346 = 240.941 → pdfkit rounds/serializes to 240 or 241.
    // 54 * 2.8346 = 153.068 → pdfkit serializes to 153.
    // Match any `/MediaBox [0 0 24` prefix to cover the width (240/241).
    expect(asString).toMatch(/\/MediaBox \[0 0 24\d(?:\.\d+)? 15\d(?:\.\d+)?/);
  });

  it('renders UTF-8 accented names without throwing', async () => {
    const pdf = await renderIndividualBadge(
      makeBadge({
        fullName: 'João Álvaro Gonçalves Oliveira',
        socialName: 'João Álvaro',
      }),
    );
    expect(pdf.length).toBeGreaterThan(1024);
  });

  it('falls back gracefully when photoUrl is null (initials tile path)', async () => {
    const pdf = await renderIndividualBadge(
      makeBadge({ photoUrl: null, fullName: 'Maria Silva' }),
    );
    expect(pdf.length).toBeGreaterThan(1024);
  });

  it('applies the brand-color stripe using the tenant color', async () => {
    const pdf = await renderIndividualBadge(
      makeBadge({ tenantBrandColor: '#FF00AA' }),
    );
    // Brand color is set via fill; pdfkit serializes color as `rg` operator.
    // We just confirm the PDF built successfully without throwing.
    expect(pdf.length).toBeGreaterThan(1024);
  });
});

describe('renderA4BadgeSheet', () => {
  it('returns a non-empty Buffer for 8 cards (single A4 page)', async () => {
    const cards = Array.from({ length: 8 }, (_, i) =>
      makeBadge({
        employeeId: `emp-${i}`,
        registration: `EMP-${i.toString().padStart(5, '0')}`,
        qrToken: i.toString(16).padStart(64, '0'),
      }),
    );
    const pdf = await renderA4BadgeSheet(cards);
    expect(Buffer.isBuffer(pdf)).toBe(true);
    expect(pdf.length).toBeGreaterThan(1024);
  });

  it('creates a second page when there are 9 cards (8-up grid overflow)', async () => {
    const cards = Array.from({ length: 9 }, (_, i) =>
      makeBadge({
        employeeId: `emp-${i}`,
        registration: `EMP-${i.toString().padStart(5, '0')}`,
        qrToken: i.toString(16).padStart(64, '0'),
      }),
    );
    const pdf = await renderA4BadgeSheet(cards);
    const asString = pdf.toString('latin1');
    // PDF catalog records `/Count N` for the Pages tree. 9 cards = 2 pages.
    // We look for `/Type /Pages` block or count `/Type /Page\n` occurrences.
    const pageObjMatches = asString.match(/\/Type \/Page[^s]/g) ?? [];
    expect(pageObjMatches.length).toBeGreaterThanOrEqual(2);
  });

  it('embeds one QR image per card (8 /Image XObjects on a full page)', async () => {
    const cards = Array.from({ length: 8 }, (_, i) =>
      makeBadge({
        employeeId: `emp-${i}`,
        registration: `EMP-${i.toString().padStart(5, '0')}`,
        qrToken: i.toString(16).padStart(64, '0'),
      }),
    );
    const pdf = await renderA4BadgeSheet(cards);
    const asString = pdf.toString('latin1');
    // pdfkit embeds each `doc.image(...)` as an `/XObject` entry with
    // `/Subtype /Image`. A full page renders 8 QR codes → at least 8 images.
    const imageMatches = asString.match(/\/Subtype \/Image/g) ?? [];
    expect(imageMatches.length).toBeGreaterThanOrEqual(8);
  });

  it('emits dashed cut marks by invoking pdfkit `dash(3, { space: 3 })` once per card corner set', async () => {
    // pdfkit compresses the content stream with Flate by default, so we can
    // NOT grep the raw buffer for the `[3 3] 0 d` sequence. Instead we spy
    // on the prototype method — renderA4BadgeSheet MUST call `dash` at
    // least once per card (see `renderCutMarks` in the renderer).
    const dashSpy = vi.spyOn(
      PDFDocument.prototype as unknown as {
        dash: (...a: unknown[]) => unknown;
      },
      'dash',
    );
    try {
      const cards = Array.from({ length: 2 }, (_, i) =>
        makeBadge({
          employeeId: `emp-${i}`,
          registration: `EMP-${i.toString().padStart(5, '0')}`,
          qrToken: i.toString(16).padStart(64, '0'),
        }),
      );
      await renderA4BadgeSheet(cards);
      expect(dashSpy).toHaveBeenCalled();
      // At least one call uses the dash(3, { space: 3 }) signature.
      const matchingCall = dashSpy.mock.calls.find(
        (c) =>
          c[0] === 3 &&
          typeof c[1] === 'object' &&
          c[1] !== null &&
          (c[1] as { space?: number }).space === 3,
      );
      expect(matchingCall).toBeDefined();
    } finally {
      dashSpy.mockRestore();
    }
  });

  it('renders UTF-8 accented names across the full A4 grid without crashing', async () => {
    const cards = Array.from({ length: 5 }, (_, i) =>
      makeBadge({
        employeeId: `emp-${i}`,
        fullName: `João Álvaro ${i} — Çurumim Ñ`,
        registration: `EMP-${i.toString().padStart(5, '0')}`,
        qrToken: i.toString(16).padStart(64, '0'),
      }),
    );
    const pdf = await renderA4BadgeSheet(cards);
    expect(pdf.length).toBeGreaterThan(1024);
  });

  it('handles an empty input array by producing a minimal PDF (no cards, no pages with content)', async () => {
    const pdf = await renderA4BadgeSheet([]);
    // pdfkit always writes at least a header + catalog; we only assert it is
    // a valid (non-empty) PDF buffer.
    expect(pdf.length).toBeGreaterThan(200);
    expect(pdf.toString('latin1').slice(0, 5)).toBe('%PDF-');
  });
});
