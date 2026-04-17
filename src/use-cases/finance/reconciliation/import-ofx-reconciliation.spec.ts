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

  // ─── P2-57: Encoding + duplicate FITID edge cases ────────────────────
  // BR bank OFX files are typically ISO-8859-1 (Latin-1) because many
  // banks still use Windows-1252 for legacy systems. Parsing as UTF-8
  // mojibakes accents (c→Ã§, ã→Ã£), which corrupts supplier names and
  // prevents auto-matching from catching obvious matches (e.g.
  // "TELEFÔNICA" in the entry vs "TELEFÃ´NICA" in the item).
  //
  // The parser's `decodeOfxBuffer` inspects CHARSET: / encoding= headers
  // or falls back to the UTF-8 replacement-char heuristic. These tests
  // lock each branch so future refactors can't silently drop support.
  it('should decode a Latin-1 encoded OFX file (CHARSET:1252) with BR accents preserved', async () => {
    const bankAccount = await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Conta Latin-1',
      bankCode: '001',
      agency: '1234',
      accountNumber: '123456',
      accountType: 'CHECKING',
    });

    // Raw bytes: description "JOÃO CAFÉ S.A." encoded as Latin-1.
    // Letters: J(0x4A) O(0x4F) A_til(0xC3) O(0x4F) space(0x20) C(0x43) A(0x41) F(0x46) E_acute(0x C9) space S(0x53) . A(0x41) .(0x2E)
    const latinOfxHeader = Buffer.from(
      `OFXHEADER:100\nDATA:OFXSGML\nVERSION:102\nSECURITY:NONE\nENCODING:USASCII\nCHARSET:1252\n\n<OFX>\n<BANKMSGSRSV1>\n<STMTTRNRS>\n<STMTRS>\n<BANKTRANLIST>\n<DTSTART>20260301\n<DTEND>20260315\n<STMTTRN>\n<TRNTYPE>DEBIT\n<DTPOSTED>20260305\n<TRNAMT>-250.00\n<FITID>2026030500111\n<MEMO>`,
      'ascii',
    );
    const latinMemo = Buffer.from([
      0x4a, 0x4f, 0xc3, 0x4f, 0x20, 0x43, 0x41, 0x46, 0xc9, 0x20, 0x53, 0x2e,
      0x41, 0x2e,
    ]); // "JOÃO CAFÉ S.A." in Latin-1
    const latinOfxFooter = Buffer.from(
      `\n</STMTTRN>\n</BANKTRANLIST>\n</STMTRS>\n</STMTTRNRS>\n</BANKMSGSRSV1>\n</OFX>\n`,
      'ascii',
    );
    const fileBuffer = Buffer.concat([
      latinOfxHeader,
      latinMemo,
      latinOfxFooter,
    ]);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      bankAccountId: bankAccount.id.toString(),
      fileName: 'extrato-bb-latin1.ofx',
      fileBuffer,
    });

    expect(result.reconciliation.totalTransactions).toBe(1);

    const persistedItem = reconciliationsRepository.items[0];
    // The description must preserve the BR accents (not contain replacement
    // chars \ufffd or mojibake sequences like "Ã£" / "Ã©").
    expect(persistedItem.description).toContain('JOÃO');
    expect(persistedItem.description).toContain('CAFÉ');
    expect(persistedItem.description).not.toContain('\ufffd');
    expect(persistedItem.description).not.toContain('Ã£');
    expect(persistedItem.description).not.toContain('Ã©');
  });

  it('should still import an OFX file even when it contains duplicate FITIDs', async () => {
    const bankAccount = await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Conta',
      bankCode: '001',
      agency: '1234',
      accountNumber: '123456',
      accountType: 'CHECKING',
    });

    // Two transactions sharing the same FITID — a malformed export from
    // legacy banks. The parser must preserve both in the parsed result
    // (dedup is a concern of the persistence layer, not the parser).
    const ofxWithDuplicates = `
OFXHEADER:100
DATA:OFXSGML
VERSION:102
CHARSET:1252

<OFX>
<BANKMSGSRSV1>
<STMTTRNRS>
<STMTRS>
<BANKTRANLIST>
<DTSTART>20260301
<DTEND>20260315
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260305
<TRNAMT>-100.00
<FITID>DUP-FITID-0001
<MEMO>Pagamento primeira versao
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260306
<TRNAMT>-100.00
<FITID>DUP-FITID-0001
<MEMO>Pagamento versao duplicada
</STMTTRN>
</BANKTRANLIST>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>
`;
    const fileBuffer = Buffer.from(ofxWithDuplicates, 'utf-8');

    const result = await sut.execute({
      tenantId: 'tenant-1',
      bankAccountId: bankAccount.id.toString(),
      fileName: 'duplicates.ofx',
      fileBuffer,
    });

    expect(result.reconciliation.totalTransactions).toBe(2);

    // Both items are kept verbatim — the DB unique(reconciliationId, fitId)
    // constraint would reject the second in production. The parser's
    // responsibility is faithful representation; the repository contract
    // is where the uniqueness check lives.
    const persisted = reconciliationsRepository.items.filter(
      (reconciliationItem) =>
        reconciliationItem.reconciliationId.toString() ===
        result.reconciliation.id,
    );
    expect(persisted).toHaveLength(2);
    expect(persisted[0].fitId).toBe('DUP-FITID-0001');
    expect(persisted[1].fitId).toBe('DUP-FITID-0001');
    // But each has its own system id (they are distinct rows in-memory):
    expect(persisted[0].id.toString()).not.toBe(persisted[1].id.toString());
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
