import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CancelBoletoUseCase } from './cancel-boleto';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { BankingProvider } from '@/services/banking/banking-provider.interface';

function makeBankingProviderMock(): BankingProvider {
  return {
    providerName: 'mock-provider',
    capabilities: ['BOLETO'],
    authenticate: vi.fn().mockResolvedValue(undefined),
    getAccounts: vi.fn(),
    getBalance: vi.fn(),
    getTransactions: vi.fn(),
    createBoleto: vi.fn(),
    cancelBoleto: vi.fn().mockResolvedValue(undefined),
    getBoleto: vi.fn(),
    createPixCharge: vi.fn(),
    executePixPayment: vi.fn(),
    getPixCharge: vi.fn(),
    executePayment: vi.fn(),
    getPaymentStatus: vi.fn(),
    registerWebhook: vi.fn(),
    handleWebhookPayload: vi.fn(),
  };
}

describe('CancelBoletoUseCase', () => {
  let financeEntriesRepo: InMemoryFinanceEntriesRepository;
  let bankingProvider: BankingProvider;
  let getProvider: (bankAccountId: string) => Promise<BankingProvider>;
  let sut: CancelBoletoUseCase;

  beforeEach(() => {
    financeEntriesRepo = new InMemoryFinanceEntriesRepository();
    bankingProvider = makeBankingProviderMock();
    getProvider = vi.fn().mockResolvedValue(bankingProvider);
    sut = new CancelBoletoUseCase(financeEntriesRepo, getProvider);
  });

  async function createEntryWithBoleto(
    overrides: Partial<{
      boletoBarcodeNumber: string | null;
      tenantId: string;
    }> = {},
  ) {
    return financeEntriesRepo.create({
      tenantId: overrides.tenantId ?? 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Boleto de cobrança',
      categoryId: 'cat-1',
      expectedAmount: 1500,
      issueDate: new Date('2025-01-01'),
      dueDate: new Date('2025-01-31'),
      boletoBarcodeNumber:
        overrides.boletoBarcodeNumber !== undefined
          ? overrides.boletoBarcodeNumber
          : '12345678901234',
    });
  }

  it('should cancel boleto and clear boleto fields from entry', async () => {
    const entry = await createEntryWithBoleto();

    await sut.execute({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      bankAccountId: 'bank-account-1',
    });

    expect(bankingProvider.authenticate).toHaveBeenCalledTimes(1);
    expect(bankingProvider.cancelBoleto).toHaveBeenCalledWith('12345678901234');

    // Verify fields are cleared (in-memory repo converts null→undefined)
    const updated = await financeEntriesRepo.findById(entry.id, 'tenant-1');
    expect(updated?.boletoBarcodeNumber ?? null).toBeNull();
  });

  it('should throw ResourceNotFoundError when entry does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        entryId: 'non-existent-entry',
        bankAccountId: 'bank-account-1',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw ResourceNotFoundError when entry has no boleto barcode number', async () => {
    const entry = await createEntryWithBoleto({ boletoBarcodeNumber: null });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        entryId: entry.id.toString(),
        bankAccountId: 'bank-account-1',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should call getProvider with the given bankAccountId', async () => {
    const entry = await createEntryWithBoleto();

    await sut.execute({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      bankAccountId: 'bank-account-abc',
    });

    expect(getProvider).toHaveBeenCalledWith('bank-account-abc');
  });

  it('should not cancel when entry belongs to different tenant', async () => {
    const entry = await createEntryWithBoleto({ tenantId: 'tenant-1' });

    await expect(
      sut.execute({
        tenantId: 'tenant-2',
        entryId: entry.id.toString(),
        bankAccountId: 'bank-account-1',
      }),
    ).rejects.toThrow(ResourceNotFoundError);

    expect(bankingProvider.cancelBoleto).not.toHaveBeenCalled();
  });

  it('should propagate errors thrown by the banking provider', async () => {
    const entry = await createEntryWithBoleto();

    vi.mocked(bankingProvider.cancelBoleto).mockRejectedValueOnce(
      new Error('Provider unavailable'),
    );

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        entryId: entry.id.toString(),
        bankAccountId: 'bank-account-1',
      }),
    ).rejects.toThrow('Provider unavailable');
  });
});
