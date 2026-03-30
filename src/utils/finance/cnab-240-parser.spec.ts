import { describe, expect, it } from 'vitest';

import { parseCnab240Return, parseCnabDate } from './cnab-240-parser';

function buildCnab240Line(
  overrides: {
    bankCode?: string;
    batchNumber?: string;
    recordType?: string;
    segmentType?: string;
    status?: string;
    boletoNumber?: string;
    amount?: string;
    paymentDate?: string;
    creditDate?: string;
  } = {},
): string {
  const line = new Array(240).fill('0').join('');
  const chars = line.split('');

  const bankCode = overrides.bankCode ?? '341';
  const batchNumber = overrides.batchNumber ?? '0001';
  const recordType = overrides.recordType ?? '3';
  const segmentType = overrides.segmentType ?? 'T';
  const status = overrides.status ?? '00';
  const boletoNumber = (
    overrides.boletoNumber ?? '12345678901234567890'
  ).padEnd(20, ' ');
  const amount = (overrides.amount ?? '000000000150000').padStart(15, '0');
  const paymentDate = overrides.paymentDate ?? '15032026';
  const creditDate = overrides.creditDate ?? '16032026';

  // Position 0-2: bank code
  for (let i = 0; i < 3; i++) chars[i] = bankCode[i] ?? '0';
  // Position 3-6: batch number
  for (let i = 0; i < 4; i++) chars[3 + i] = batchNumber[i] ?? '0';
  // Position 7: record type
  chars[7] = recordType;
  // Position 13: segment type
  chars[13] = segmentType;
  // Position 15-16: status
  chars[15] = status[0];
  chars[16] = status[1];
  // Position 37-56: boleto number
  for (let i = 0; i < 20; i++) chars[37 + i] = boletoNumber[i] ?? ' ';
  // Position 81-95: amount
  for (let i = 0; i < 15; i++) chars[81 + i] = amount[i] ?? '0';
  // Position 143-150: payment date
  for (let i = 0; i < 8; i++) chars[143 + i] = paymentDate[i] ?? '0';
  // Position 151-158: credit date
  for (let i = 0; i < 8; i++) chars[151 + i] = creditDate[i] ?? '0';

  return chars.join('');
}

describe('parseCnabDate', () => {
  it('should parse DDMMYYYY format correctly', () => {
    const parsedDate = parseCnabDate('15032026');
    expect(parsedDate.getDate()).toBe(15);
    expect(parsedDate.getMonth()).toBe(2); // March (0-indexed)
    expect(parsedDate.getFullYear()).toBe(2026);
  });

  it('should return epoch for zeroed date', () => {
    const parsedDate = parseCnabDate('00000000');
    expect(parsedDate.getTime()).toBe(0);
  });

  it('should return epoch for empty string', () => {
    const parsedDate = parseCnabDate('');
    expect(parsedDate.getTime()).toBe(0);
  });
});

describe('parseCnab240Return', () => {
  it('should parse a valid segment T record', () => {
    const line = buildCnab240Line({
      bankCode: '341',
      boletoNumber: 'BOLETO-001          ',
      amount: '000000000150000',
      paymentDate: '15032026',
      creditDate: '16032026',
      status: '00',
    });

    const records = parseCnab240Return(line);

    expect(records).toHaveLength(1);
    expect(records[0].bankCode).toBe('341');
    expect(records[0].boletoNumber).toBe('BOLETO-001');
    expect(records[0].amount).toBe(1500);
    expect(records[0].status).toBe('00');
    expect(records[0].paymentDate.getDate()).toBe(15);
    expect(records[0].creditDate.getDate()).toBe(16);
  });

  it('should ignore lines shorter than 240 characters', () => {
    const shortLine = '341000130T00BOLETO-001';
    const records = parseCnab240Return(shortLine);
    expect(records).toHaveLength(0);
  });

  it('should ignore non-detail records (recordType != 3)', () => {
    const headerLine = buildCnab240Line({ recordType: '0' });
    const records = parseCnab240Return(headerLine);
    expect(records).toHaveLength(0);
  });

  it('should ignore segment U records', () => {
    const segmentULine = buildCnab240Line({ segmentType: 'U' });
    const records = parseCnab240Return(segmentULine);
    expect(records).toHaveLength(0);
  });

  it('should parse multiple records', () => {
    const line1 = buildCnab240Line({
      boletoNumber: 'BOLETO-001          ',
      amount: '000000000100000',
      status: '00',
    });
    const line2 = buildCnab240Line({
      boletoNumber: 'BOLETO-002          ',
      amount: '000000000250000',
      status: '02',
    });

    const records = parseCnab240Return(`${line1}\n${line2}`);

    expect(records).toHaveLength(2);
    expect(records[0].boletoNumber).toBe('BOLETO-001');
    expect(records[0].amount).toBe(1000);
    expect(records[1].boletoNumber).toBe('BOLETO-002');
    expect(records[1].amount).toBe(2500);
    expect(records[1].status).toBe('02');
  });

  it('should handle empty content', () => {
    const records = parseCnab240Return('');
    expect(records).toHaveLength(0);
  });
});
