import { describe, expect, it } from 'vitest';

import {
  renderPunchExportPdf,
  type PunchExportPdfOpts,
} from './punch-export-pdf-renderer';
import type { PunchExportRow } from '@/lib/csv/punch-csv-builder';

function row(overrides: Partial<PunchExportRow> = {}): PunchExportRow {
  return {
    nsr: 1001,
    employeeRegistration: '00123',
    employeeName: 'JOAO DA SILVA',
    department: 'TI',
    date: new Date('2026-04-15T00:00:00.000Z'),
    time: '08:02:15',
    type: 'IN',
    status: 'NORMAL',
    approvalNote: null,
    deviceKind: 'MOBILE',
    geoLat: null,
    geoLng: null,
    geofenceDistance: null,
    originNsr: null,
    adjustmentNsr: null,
    ...overrides,
  };
}

const baseOpts: PunchExportPdfOpts = {
  tenantName: 'Empresa Demo LTDA',
  cnpj: '12345678000190',
  startDate: new Date('2026-04-01T00:00:00.000Z'),
  endDate: new Date('2026-04-15T23:59:59.999Z'),
  generatedBy: 'user-uuid-000',
};

describe('renderPunchExportPdf', () => {
  it('retorna Buffer começando com magic bytes %PDF- para rows vazias', async () => {
    const buffer = await renderPunchExportPdf([], baseOpts);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(buffer.length).toBeGreaterThan(512);
  });

  it('renderiza 1 row sem lançar', async () => {
    const buffer = await renderPunchExportPdf([row()], baseOpts);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(buffer.length).toBeGreaterThan(1024);
  });

  it('renderiza 60 rows (força paginação landscape)', async () => {
    const rows: PunchExportRow[] = Array.from({ length: 60 }, (_, i) =>
      row({ nsr: 2000 + i, employeeName: `FUNC ${i}` }),
    );
    const buffer = await renderPunchExportPdf(rows, baseOpts);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    // Com paginação forçada a cada ~40 rows landscape, o arquivo deve crescer
    // proporcionalmente em relação ao de 1 row.
    expect(buffer.length).toBeGreaterThan(2048);
  });

  it('não lança quando tenantName contém acento', async () => {
    const buffer = await renderPunchExportPdf(
      [row({ employeeName: 'JOÃO D AVIS' })],
      { ...baseOpts, tenantName: 'Ação & Reação S/A' },
    );
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(512);
  });

  it('LGPD sentinel — helper não inclui a string "cpf" no dump não-binário metadata', async () => {
    // Não é possível inspecionar texto do PDF sem parser, mas garantimos que
    // o helper não escreva "cpf" no metadata string via reflexão do buffer
    // inicial (metadata do pdfkit fica nas primeiras páginas).
    const buffer = await renderPunchExportPdf([row()], baseOpts);
    // Extract only the textual header slice (first 200 bytes are %PDF + objs);
    // this is a smoke check — the full defense is in the data layer
    // (PunchExportRow has no cpf field).
    const head = buffer.subarray(0, 2048).toString('latin1').toLowerCase();
    expect(head).not.toContain('cpf');
  });
});
