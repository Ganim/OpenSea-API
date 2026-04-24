/**
 * Phase 7 / Plan 07-04 — D-11 PDF renderer for punch batch export.
 *
 * Renders an A4-landscape PDF with tenant header, filters, and a compact
 * table of punch rows. Uses `pdfkit` (already in use by badge/receipt/folha).
 *
 * **Scope:** read-only formatter — receives a pre-shaped `PunchExportRow[]`
 * (built by `buildPunchExportDataset`, which NEVER includes CPF — LGPD
 * boundary T-7-04-01). This module therefore cannot accidentally leak CPF
 * because no code path here references that field.
 */

import PDFDocument from 'pdfkit';

import type { PunchExportRow } from '@/lib/csv/punch-csv-builder';

export interface PunchExportPdfOpts {
  tenantName: string;
  /** CNPJ sem máscara (14 dígitos). */
  cnpj: string;
  startDate: Date;
  endDate: Date;
  /** User ID do operador que solicitou. Aparece no rodapé. */
  generatedBy: string;
}

const PAGE_MARGIN = 30;
const TABLE_FONT_SIZE = 8;
const HEADER_FONT_SIZE = 14;
const FOOTER_FONT_SIZE = 7;

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatCnpj(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '').padStart(14, '0');
  return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(
    5,
    8,
  )}/${cleaned.slice(8, 12)}-${cleaned.slice(12, 14)}`;
}

/**
 * Renders the punch export PDF and resolves to a Buffer.
 *
 * Layout A4-landscape, table simples text-flow com line-break manual por
 * página. `pdfkit` é stream-based; capturamos chunks e retornamos um Buffer
 * concatenado (pattern consistente com `receipt-pdf-renderer`).
 */
export function renderPunchExportPdf(
  rows: PunchExportRow[],
  opts: PunchExportPdfOpts,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: PAGE_MARGIN,
        info: {
          Title: 'Export de Batidas',
          Author: 'OpenSea',
          Subject: `Export periodo ${isoDate(opts.startDate)}..${isoDate(opts.endDate)}`,
          Creator: 'OpenSea-API',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ── Header ───────────────────────────────────────────────────────────
      doc.fontSize(HEADER_FONT_SIZE).text(opts.tenantName, { align: 'left' });
      doc.fontSize(10).text(`CNPJ: ${formatCnpj(opts.cnpj)}`);
      doc.text(
        `Periodo: ${isoDate(opts.startDate)} a ${isoDate(opts.endDate)}`,
      );
      doc.text(`Total de batidas: ${rows.length}`);
      doc.moveDown(0.5);

      // ── Table header ─────────────────────────────────────────────────────
      doc.fontSize(TABLE_FONT_SIZE);
      const colHeader =
        'NSR | Matr. | Funcionario | Depto | Data | Hora | Tipo | Status | Dispositivo';
      doc.text(colHeader);
      doc.moveDown(0.2);

      // Page-break threshold — se `doc.y` passar do fim da página, addPage.
      const pageBottom = doc.page.height - PAGE_MARGIN - 20;

      for (const r of rows) {
        if (doc.y > pageBottom) {
          doc.addPage();
          doc.fontSize(TABLE_FONT_SIZE).text(colHeader);
          doc.moveDown(0.2);
        }
        const line = [
          String(r.nsr),
          r.employeeRegistration,
          r.employeeName,
          r.department ?? '',
          isoDate(r.date),
          r.time,
          r.type,
          r.status,
          r.deviceKind,
        ].join(' | ');
        doc.text(line);
      }

      // ── Footer ───────────────────────────────────────────────────────────
      doc.moveDown(0.5);
      doc
        .fontSize(FOOTER_FONT_SIZE)
        .text(`Gerado por ${opts.generatedBy} em ${new Date().toISOString()}`, {
          align: 'right',
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
