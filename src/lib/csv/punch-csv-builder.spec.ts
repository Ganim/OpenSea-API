import { describe, expect, it } from 'vitest';

import {
  buildPunchCsv,
  PUNCH_CSV_HEADERS,
  type PunchExportRow,
} from './punch-csv-builder';

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
    geoLat: -23.5505,
    geoLng: -46.6333,
    geofenceDistance: 12,
    originNsr: null,
    adjustmentNsr: null,
    ...overrides,
  };
}

const BOM_BYTES = Buffer.from([0xef, 0xbb, 0xbf]);

describe('buildPunchCsv', () => {
  it('gera buffer com BOM UTF-8 + header row mesmo com rows vazias', () => {
    const buffer = buildPunchCsv([]);
    expect(buffer.subarray(0, 3).equals(BOM_BYTES)).toBe(true);
    const text = buffer.subarray(3).toString('utf-8');
    expect(text).toBe(PUNCH_CSV_HEADERS.join(';'));
  });

  it('usa separador ; por default e `\r\n` como line ending', () => {
    const buffer = buildPunchCsv([row()]);
    const text = buffer.subarray(3).toString('utf-8');
    const lines = text.split('\r\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe(PUNCH_CSV_HEADERS.join(';'));
    expect(lines[1]).toContain(';JOAO DA SILVA;TI;');
  });

  it('escapa valores com separador envolvendo em aspas duplas', () => {
    const buffer = buildPunchCsv([row({ employeeName: 'SILVA; ANA' })]);
    const text = buffer.subarray(3).toString('utf-8');
    expect(text).toContain('"SILVA; ANA"');
  });

  it('duplica aspas internas em valores escapados', () => {
    const buffer = buildPunchCsv([row({ approvalNote: 'Gestor disse "OK"' })]);
    const text = buffer.subarray(3).toString('utf-8');
    expect(text).toContain('"Gestor disse ""OK"""');
  });

  it('escapa newline embutido em campo de texto', () => {
    const buffer = buildPunchCsv([row({ approvalNote: 'linha1\nlinha2' })]);
    const text = buffer.subarray(3).toString('utf-8');
    expect(text).toContain('"linha1\nlinha2"');
  });

  it('aceita separador `,` quando opção é passada', () => {
    const buffer = buildPunchCsv([row()], { separator: ',' });
    const text = buffer.subarray(3).toString('utf-8');
    expect(text.split('\r\n')[0]).toBe(PUNCH_CSV_HEADERS.join(','));
  });

  it('renderiza null/undefined como célula vazia', () => {
    const buffer = buildPunchCsv([
      row({ department: null, geoLat: null, geoLng: null }),
    ]);
    const text = buffer.subarray(3).toString('utf-8');
    const dataLine = text.split('\r\n')[1];
    const cells = dataLine.split(';');
    // department column index = 3 (0-based: nsr,matricula,nome,depto...)
    expect(cells[3]).toBe('');
  });

  it('LGPD sentinel — header não contém CPF', () => {
    const buffer = buildPunchCsv([]);
    const text = buffer.subarray(3).toString('utf-8');
    expect(text.toLowerCase()).not.toContain('cpf');
  });

  it('renderiza date como YYYY-MM-DD (ISO date slice)', () => {
    const buffer = buildPunchCsv([
      row({ date: new Date('2026-04-15T23:45:00.000Z') }),
    ]);
    const text = buffer.subarray(3).toString('utf-8');
    const dataLine = text.split('\r\n')[1];
    expect(dataLine).toContain('2026-04-15');
  });

  it('produz 15 colunas no header (NSR até NSR_Correcao)', () => {
    expect(PUNCH_CSV_HEADERS).toHaveLength(15);
    expect(PUNCH_CSV_HEADERS[0]).toBe('NSR');
    expect(PUNCH_CSV_HEADERS[PUNCH_CSV_HEADERS.length - 1]).toBe(
      'NSR_Correcao',
    );
  });
});
