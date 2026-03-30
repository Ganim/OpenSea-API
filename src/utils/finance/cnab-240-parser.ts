/**
 * CNAB 240 Return File Parser
 *
 * Parses CNAB 240 format bank return files (retorno bancário)
 * for boleto payment confirmations and reconciliation.
 *
 * CNAB 240 structure:
 * - Position 8 (index 7): Record type ('0'=header, '1'=batch header, '3'=detail, '5'=batch trailer, '9'=file trailer)
 * - Position 14 (index 13): Segment type for detail records ('T'=title data, 'U'=complement)
 */

export interface CnabReturnRecord {
  bankCode: string;
  batchNumber: number;
  recordType: string;
  segmentType: string;
  boletoNumber: string;
  amount: number;
  paymentDate: Date;
  creditDate: Date;
  status: string;
}

export const CNAB_STATUS_CODES: Record<string, string> = {
  '00': 'CONFIRMED',
  '02': 'NOT_FOUND',
  '03': 'REJECTED',
  '05': 'LIQUIDATED_NO_REGISTER',
  '06': 'ENTRY_LIQUIDATED',
  '09': 'WRITE_OFF',
  '12': 'PAYMENT_CONFIRMED',
  '17': 'ENTRY_LIQUIDATED_AFTER_DUE',
  '19': 'CONFIRMATION_OF_INSTRUCTION',
};

export function parseCnabDate(dateStr: string): Date {
  if (!dateStr || dateStr.trim().length < 8 || dateStr === '00000000') {
    return new Date(0);
  }

  const day = parseInt(dateStr.substring(0, 2), 10);
  const month = parseInt(dateStr.substring(2, 4), 10) - 1;
  const year = parseInt(dateStr.substring(4, 8), 10);

  return new Date(year, month, day);
}

export function parseCnab240Return(content: string): CnabReturnRecord[] {
  const lines = content.split('\n');
  const records: CnabReturnRecord[] = [];

  for (const line of lines) {
    if (line.length < 240) continue;

    const recordType = line.charAt(7);
    if (recordType !== '3') continue;

    const segmentType = line.charAt(13);

    if (segmentType === 'T') {
      records.push({
        bankCode: line.substring(0, 3),
        batchNumber: parseInt(line.substring(3, 7), 10),
        recordType,
        segmentType,
        boletoNumber: line.substring(37, 57).trim(),
        amount: parseInt(line.substring(81, 96), 10) / 100,
        paymentDate: parseCnabDate(line.substring(143, 151)),
        creditDate: parseCnabDate(line.substring(151, 159)),
        status: line.substring(15, 17),
      });
    }
  }

  return records;
}
