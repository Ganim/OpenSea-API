/**
 * Phase 7 / Plan 07-04 — D-11 CSV builder for punch batch export.
 *
 * Zero-dependency CSV generator (~15 cols) producing:
 *   - UTF-8 BOM prefix (U+FEFF) so Excel BR opens accented chars correctly.
 *   - Default separator `;` (Brazilian Excel default) — parametrizable to `,`.
 *   - `\r\n` line endings (RFC 4180).
 *   - Cell escaping per RFC 4180: wrap in `"` + double internal `"` when a cell
 *     contains the separator, `\n`, or `"`.
 *
 * **LGPD (T-7-04-01):** This module never writes CPF. The `PunchExportRow`
 * shape deliberately omits the `cpf` field — there is no code path here that
 * serialises that data into the buffer. The build-punch-export-dataset use
 * case is the upstream gate that shapes the rows without the CPF column.
 */

export interface PunchExportRow {
  nsr: number;
  employeeRegistration: string;
  employeeName: string;
  department: string | null;
  date: Date;
  time: string;
  type:
    | 'IN'
    | 'OUT'
    | 'BREAK_IN'
    | 'BREAK_OUT'
    | 'OVERTIME_IN'
    | 'OVERTIME_OUT';
  status: string;
  approvalNote: string | null;
  deviceKind: string;
  geoLat: number | null;
  geoLng: number | null;
  geofenceDistance: number | null;
  originNsr: number | null;
  adjustmentNsr: number | null;
}

export const PUNCH_CSV_HEADERS = [
  'NSR',
  'Matricula',
  'Funcionario',
  'Departamento',
  'Data',
  'Hora',
  'Tipo_Batida',
  'Status',
  'Justificativa_Aprovacao',
  'Dispositivo',
  'GPS_Lat',
  'GPS_Lng',
  'Distancia_Geofence_m',
  'NSR_Original',
  'NSR_Correcao',
] as const;

export type PunchCsvSeparator = ',' | ';';

export interface BuildPunchCsvOptions {
  separator?: PunchCsvSeparator;
}

const BOM = Buffer.from([0xef, 0xbb, 0xbf]);
const LINE_ENDING = '\r\n';

function escapeCell(value: unknown, sep: string): string {
  if (value === null || value === undefined) return '';
  const s = typeof value === 'string' ? value : String(value);
  if (s.length === 0) return '';
  if (
    s.includes(sep) ||
    s.includes('\n') ||
    s.includes('\r') ||
    s.includes('"')
  ) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Builds the CSV buffer with BOM prefix.
 *
 * @param rows — Export rows already resolved by `buildPunchExportDataset`.
 *               NEVER contains CPF (LGPD boundary — see module doc).
 * @param opts — Optional separator (default `;`).
 */
export function buildPunchCsv(
  rows: PunchExportRow[],
  opts: BuildPunchCsvOptions = {},
): Buffer {
  const sep = opts.separator ?? ';';

  const headerLine = PUNCH_CSV_HEADERS.join(sep);
  const lines: string[] = [headerLine];

  for (const r of rows) {
    const cells: Array<unknown> = [
      r.nsr,
      r.employeeRegistration,
      r.employeeName,
      r.department ?? '',
      toIsoDate(r.date),
      r.time,
      r.type,
      r.status,
      r.approvalNote ?? '',
      r.deviceKind,
      r.geoLat ?? '',
      r.geoLng ?? '',
      r.geofenceDistance ?? '',
      r.originNsr ?? '',
      r.adjustmentNsr ?? '',
    ];
    lines.push(cells.map((c) => escapeCell(c, sep)).join(sep));
  }

  const body = Buffer.from(lines.join(LINE_ENDING), 'utf-8');
  return Buffer.concat([BOM, body]);
}
