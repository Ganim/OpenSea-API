import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetBoletoUseCase } from './get-boleto';
import type {
  BankingProvider,
  BoletoResult,
} from '@/services/banking/banking-provider.interface';

function makeBoletoResult(overrides: Partial<BoletoResult> = {}): BoletoResult {
  return {
    nossoNumero: '12345678901234',
    barcode: '34191.75676 57673.941514 71308.571003 8 98810000150000',
    digitableLine: '34191756765767394151471308571003898810000150000',
    pixCopyPaste: '00020126580014BR.GOV.BCB.PIX',
    pdfUrl: 'https://bank.example.com/boleto/12345678901234.pdf',
    status: 'ACTIVE',
    dueDate: '2025-01-31',
    amount: 1500,
    ...overrides,
  };
}

function makeBankingProviderMock(): BankingProvider {
  return {
    providerName: 'mock-provider',
    capabilities: ['BOLETO'],
    authenticate: vi.fn().mockResolvedValue(undefined),
    getAccounts: vi.fn(),
    getBalance: vi.fn(),
    getTransactions: vi.fn(),
    createBoleto: vi.fn(),
    cancelBoleto: vi.fn(),
    getBoleto: vi.fn().mockResolvedValue(makeBoletoResult()),
    createPixCharge: vi.fn(),
    executePixPayment: vi.fn(),
    getPixCharge: vi.fn(),
    executePayment: vi.fn(),
    getPaymentStatus: vi.fn(),
    registerWebhook: vi.fn(),
    handleWebhookPayload: vi.fn(),
  };
}

describe('GetBoletoUseCase', () => {
  let bankingProvider: BankingProvider;
  let getProvider: (bankAccountId: string) => Promise<BankingProvider>;
  let sut: GetBoletoUseCase;

  beforeEach(() => {
    bankingProvider = makeBankingProviderMock();
    getProvider = vi.fn().mockResolvedValue(bankingProvider);
    sut = new GetBoletoUseCase(getProvider);
  });

  it('should return the boleto result from the provider', async () => {
    const result = await sut.execute({
      nossoNumero: '12345678901234',
      bankAccountId: 'bank-account-1',
    });

    expect(result.boleto).toBeDefined();
    expect(result.boleto.nossoNumero).toBe('12345678901234');
    expect(result.boleto.status).toBe('ACTIVE');
    expect(result.boleto.amount).toBe(1500);
  });

  it('should call authenticate before getBoleto', async () => {
    await sut.execute({
      nossoNumero: '12345678901234',
      bankAccountId: 'bank-account-1',
    });

    const authenticateCallOrder = vi.mocked(bankingProvider.authenticate).mock
      .invocationCallOrder[0];
    const getBoletoCallOrder = vi.mocked(bankingProvider.getBoleto).mock
      .invocationCallOrder[0];

    expect(authenticateCallOrder).toBeLessThan(getBoletoCallOrder);
  });

  it('should call getProvider with the given bankAccountId', async () => {
    await sut.execute({
      nossoNumero: '12345678901234',
      bankAccountId: 'bank-account-xyz',
    });

    expect(getProvider).toHaveBeenCalledWith('bank-account-xyz');
  });

  it('should pass nossoNumero to getBoleto', async () => {
    const nossoNumero = '98765432109876';

    await sut.execute({
      nossoNumero,
      bankAccountId: 'bank-account-1',
    });

    expect(bankingProvider.getBoleto).toHaveBeenCalledWith(nossoNumero);
  });

  it('should return boleto with PAID status', async () => {
    vi.mocked(bankingProvider.getBoleto).mockResolvedValueOnce(
      makeBoletoResult({ status: 'PAID' }),
    );

    const result = await sut.execute({
      nossoNumero: '12345678901234',
      bankAccountId: 'bank-account-1',
    });

    expect(result.boleto.status).toBe('PAID');
  });

  it('should propagate errors from the banking provider', async () => {
    vi.mocked(bankingProvider.getBoleto).mockRejectedValueOnce(
      new Error('Boleto not found in provider'),
    );

    await expect(
      sut.execute({
        nossoNumero: 'unknown-numero',
        bankAccountId: 'bank-account-1',
      }),
    ).rejects.toThrow('Boleto not found in provider');
  });

  it('should propagate errors from authenticate', async () => {
    vi.mocked(bankingProvider.authenticate).mockRejectedValueOnce(
      new Error('Authentication failed'),
    );

    await expect(
      sut.execute({
        nossoNumero: '12345678901234',
        bankAccountId: 'bank-account-1',
      }),
    ).rejects.toThrow('Authentication failed');
  });
});
