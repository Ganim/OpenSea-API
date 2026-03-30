import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { beforeEach, describe, expect, it } from 'vitest';

import { ProcessCnabReturnUseCase } from './process-cnab-return';

let financeEntriesRepository: InMemoryFinanceEntriesRepository;
let sut: ProcessCnabReturnUseCase;

function buildCnab240Line(
  overrides: {
    boletoNumber?: string;
    amount?: string;
    paymentDate?: string;
    creditDate?: string;
    status?: string;
  } = {},
): string {
  const chars = new Array(240).fill('0');

  // Bank code (pos 0-2)
  chars[0] = '3';
  chars[1] = '4';
  chars[2] = '1';
  // Batch number (pos 3-6)
  chars[3] = '0';
  chars[4] = '0';
  chars[5] = '0';
  chars[6] = '1';
  // Record type (pos 7)
  chars[7] = '3';
  // Segment type (pos 13)
  chars[13] = 'T';
  // Status (pos 15-16)
  const statusCode = overrides.status ?? '00';
  chars[15] = statusCode[0];
  chars[16] = statusCode[1];
  // Boleto number (pos 37-56)
  const boletoNum = (overrides.boletoNumber ?? '12345678901234567890').padEnd(
    20,
    ' ',
  );
  for (let i = 0; i < 20; i++) chars[37 + i] = boletoNum[i];
  // Amount (pos 81-95)
  const amountStr = (overrides.amount ?? '000000000150000').padStart(15, '0');
  for (let i = 0; i < 15; i++) chars[81 + i] = amountStr[i];
  // Payment date (pos 143-150)
  const payDate = overrides.paymentDate ?? '15032026';
  for (let i = 0; i < 8; i++) chars[143 + i] = payDate[i];
  // Credit date (pos 151-158)
  const credDate = overrides.creditDate ?? '16032026';
  for (let i = 0; i < 8; i++) chars[151 + i] = credDate[i];

  return chars.join('');
}

describe('ProcessCnabReturnUseCase', () => {
  beforeEach(() => {
    financeEntriesRepository = new InMemoryFinanceEntriesRepository();
    sut = new ProcessCnabReturnUseCase(financeEntriesRepository);
  });

  it('should throw when file content is empty', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        fileContent: '',
        bankAccountId: 'bank-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw when no valid records found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        fileContent: 'short line content',
        bankAccountId: 'bank-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should match and pay a pending entry by boletoBarcodeNumber', async () => {
    const boletoNumber = 'BOLETO-TEST-001';

    const entry = await financeEntriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Customer payment',
      categoryId: new UniqueEntityID().toString(),
      expectedAmount: 1500,
      issueDate: new Date(),
      dueDate: new Date(),
      status: 'PENDING',
      boletoBarcodeNumber: boletoNumber,
    });

    const cnabLine = buildCnab240Line({
      boletoNumber,
      amount: '000000000150000',
      status: '00',
    });

    const response = await sut.execute({
      tenantId: 'tenant-1',
      fileContent: cnabLine,
      bankAccountId: 'bank-1',
    });

    expect(response.processed).toBe(1);
    expect(response.matched).toBe(1);
    expect(response.unmatched).toBe(0);
    expect(response.details[0].status).toBe('MATCHED');
    expect(response.details[0].entryId).toBe(entry.id.toString());

    const updatedEntry = financeEntriesRepository.items.find((e) =>
      e.id.equals(entry.id),
    );
    expect(updatedEntry?.status).toBe('RECEIVED');
  });

  it('should report NOT_FOUND for unmatched boletos', async () => {
    const cnabLine = buildCnab240Line({
      boletoNumber: 'UNKNOWN-BOLETO-999',
      amount: '000000000100000',
      status: '00',
    });

    const response = await sut.execute({
      tenantId: 'tenant-1',
      fileContent: cnabLine,
      bankAccountId: 'bank-1',
    });

    expect(response.processed).toBe(1);
    expect(response.matched).toBe(0);
    expect(response.unmatched).toBe(1);
    expect(response.details[0].status).toBe('NOT_FOUND');
  });

  it('should report ALREADY_PAID for already settled entries', async () => {
    const boletoNumber = 'BOLETO-PAID-001';

    await financeEntriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-002',
      description: 'Already paid',
      categoryId: new UniqueEntityID().toString(),
      expectedAmount: 1000,
      issueDate: new Date(),
      dueDate: new Date(),
      status: 'RECEIVED',
      boletoBarcodeNumber: boletoNumber,
    });

    const cnabLine = buildCnab240Line({
      boletoNumber,
      amount: '000000000100000',
      status: '00',
    });

    const response = await sut.execute({
      tenantId: 'tenant-1',
      fileContent: cnabLine,
      bankAccountId: 'bank-1',
    });

    expect(response.details[0].status).toBe('ALREADY_PAID');
  });

  it('should handle non-confirmed records separately', async () => {
    const confirmedLine = buildCnab240Line({
      boletoNumber: 'CONFIRMED-001',
      status: '00',
    });
    const rejectedLine = buildCnab240Line({
      boletoNumber: 'REJECTED-001',
      status: '02',
    });

    const response = await sut.execute({
      tenantId: 'tenant-1',
      fileContent: `${confirmedLine}\n${rejectedLine}`,
      bankAccountId: 'bank-1',
    });

    expect(response.processed).toBe(2);
    const rejectedDetail = response.details.find(
      (d) => d.boletoNumber === 'REJECTED-001',
    );
    expect(rejectedDetail?.status).toBe('NOT_FOUND');
  });
});
