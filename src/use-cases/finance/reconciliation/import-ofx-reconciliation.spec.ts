import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryBankAccountsRepository } from '@/repositories/finance/in-memory/in-memory-bank-accounts-repository';
import { InMemoryBankReconciliationsRepository } from '@/repositories/finance/in-memory/in-memory-bank-reconciliations-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ImportOfxReconciliationUseCase } from './import-ofx-reconciliation';

const VALID_OFX_CONTENT = `
OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS><CODE>0<SEVERITY>INFO</STATUS>
<DTSERVER>20260301120000
<LANGUAGE>POR
</SONRS>
</SIGNONMSGSRSV1>
<BANKMSGSRSV1>
<STMTTRNRS>
<TRNUID>1001
<STATUS><CODE>0<SEVERITY>INFO</STATUS>
<STMTRS>
<CURDEF>BRL
<BANKACCTFROM>
<BANKID>001
<ACCTID>123456
<ACCTTYPE>CHECKING
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>20260301
<DTEND>20260315
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260305120000
<TRNAMT>-150.00
<FITID>2026030500001
<MEMO>PIX ENVIADO - FORNECEDOR ABC
</STMTTRN>
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20260310120000
<TRNAMT>500.00
<FITID>2026031000001
<MEMO>TED RECEBIDO - CLIENTE XYZ
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260312120000
<TRNAMT>-75.50
<FITID>2026031200001
<MEMO>PAGTO BOLETO - LUZ
</STMTTRN>
</BANKTRANLIST>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>
`;

let bankAccountsRepository: InMemoryBankAccountsRepository;
let reconciliationsRepository: InMemoryBankReconciliationsRepository;
let financeEntriesRepository: InMemoryFinanceEntriesRepository;
let sut: ImportOfxReconciliationUseCase;

describe('ImportOfxReconciliationUseCase', () => {
  beforeEach(() => {
    bankAccountsRepository = new InMemoryBankAccountsRepository();
    reconciliationsRepository = new InMemoryBankReconciliationsRepository();
    financeEntriesRepository = new InMemoryFinanceEntriesRepository();
    sut = new ImportOfxReconciliationUseCase(
      bankAccountsRepository,
      reconciliationsRepository,
      financeEntriesRepository,
    );
  });

  it('should import OFX file and create reconciliation with items', async () => {
    const bankAccount = await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Conta Principal',
      bankCode: '001',
      agency: '1234',
      accountNumber: '123456',
      accountType: 'CHECKING',
    });

    const fileBuffer = Buffer.from(VALID_OFX_CONTENT, 'utf-8');

    const result = await sut.execute({
      tenantId: 'tenant-1',
      bankAccountId: bankAccount.id.toString(),
      fileName: 'extrato-marco.ofx',
      fileBuffer,
    });

    expect(result.reconciliation.totalTransactions).toBe(3);
    expect(result.reconciliation.status).toBe('IN_PROGRESS');
    expect(result.reconciliation.fileName).toBe('extrato-marco.ofx');
    expect(result.reconciliation.bankAccountId).toBe(bankAccount.id.toString());
  });

  it('should reject file exceeding 5MB', async () => {
    const bankAccount = await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Conta',
      bankCode: '001',
      agency: '1234',
      accountNumber: '123456',
      accountType: 'CHECKING',
    });

    const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        bankAccountId: bankAccount.id.toString(),
        fileName: 'large.ofx',
        fileBuffer: largeBuffer,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should reject when bank account does not exist', async () => {
    const fileBuffer = Buffer.from(VALID_OFX_CONTENT, 'utf-8');

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        bankAccountId: 'non-existent-id',
        fileName: 'extrato.ofx',
        fileBuffer,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should reject invalid OFX content', async () => {
    const bankAccount = await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Conta',
      bankCode: '001',
      agency: '1234',
      accountNumber: '123456',
      accountType: 'CHECKING',
    });

    const invalidBuffer = Buffer.from('This is not an OFX file', 'utf-8');

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        bankAccountId: bankAccount.id.toString(),
        fileName: 'invalid.ofx',
        fileBuffer: invalidBuffer,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should set correct period from OFX file', async () => {
    const bankAccount = await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Conta',
      bankCode: '001',
      agency: '1234',
      accountNumber: '123456',
      accountType: 'CHECKING',
    });

    const fileBuffer = Buffer.from(VALID_OFX_CONTENT, 'utf-8');

    const result = await sut.execute({
      tenantId: 'tenant-1',
      bankAccountId: bankAccount.id.toString(),
      fileName: 'extrato.ofx',
      fileBuffer,
    });

    expect(result.reconciliation.periodStart).toBeInstanceOf(Date);
    expect(result.reconciliation.periodEnd).toBeInstanceOf(Date);
  });

  it('should recompute unmatchedCount from persisted items (not total - matched)', async () => {
    const bankAccount = await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Conta',
      bankCode: '001',
      agency: '1234',
      accountNumber: '123456',
      accountType: 'CHECKING',
    });

    const fileBuffer = Buffer.from(VALID_OFX_CONTENT, 'utf-8');

    const result = await sut.execute({
      tenantId: 'tenant-1',
      bankAccountId: bankAccount.id.toString(),
      fileName: 'extrato.ofx',
      fileBuffer,
    });

    const persistedItems = reconciliationsRepository.items.filter(
      (reconciliationItem) =>
        reconciliationItem.reconciliationId.toString() ===
        result.reconciliation.id,
    );

    const expectedMatchedCount = persistedItems.filter(
      (reconciliationItem) => reconciliationItem.isMatched,
    ).length;
    const expectedUnmatchedCount = persistedItems.filter(
      (reconciliationItem) => reconciliationItem.matchStatus === 'UNMATCHED',
    ).length;

    expect(result.reconciliation.matchedCount).toBe(expectedMatchedCount);
    expect(result.reconciliation.unmatchedCount).toBe(expectedUnmatchedCount);
    // Without any finance entries present, every imported transaction stays
    // UNMATCHED. Unmatched count must equal persisted unmatched items, not
    // total - matched (which would mask suggestion/manual transitions).
    expect(result.reconciliation.unmatchedCount).toBe(persistedItems.length);
    expect(result.reconciliation.matchedCount).toBe(0);
  });
});
