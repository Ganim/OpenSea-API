import type {
  BankingProvider,
  PixChargeResult,
} from '@/services/banking/banking-provider.interface';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetPixChargeUseCase } from './get-pix-charge';

const mockPixChargeResult: PixChargeResult = {
  txId: 'tx-abc-123',
  status: 'ACTIVE',
  pixCopyPaste: '00020126580014br.gov.bcb.pix...',
  qrCodeBase64: 'data:image/png;base64,abc123',
  amount: 250.0,
  createdAt: new Date().toISOString(),
};

const mockProvider: BankingProvider = {
  providerName: 'MOCK_BANK',
  capabilities: ['PIX'],
  authenticate: vi.fn().mockResolvedValue(undefined),
  getAccounts: vi.fn(),
  getBalance: vi.fn(),
  getTransactions: vi.fn(),
  createBoleto: vi.fn(),
  cancelBoleto: vi.fn(),
  getBoleto: vi.fn(),
  createPixCharge: vi.fn(),
  executePixPayment: vi.fn(),
  getPixCharge: vi.fn().mockResolvedValue(mockPixChargeResult),
  executePayment: vi.fn(),
  getPaymentStatus: vi.fn(),
  registerWebhook: vi.fn(),
  handleWebhookPayload: vi.fn(),
};

let sut: GetPixChargeUseCase;
let getProvider: ReturnType<typeof vi.fn>;

describe('GetPixChargeUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getProvider = vi.fn().mockResolvedValue(mockProvider);
    sut = new GetPixChargeUseCase(getProvider);
  });

  it('should retrieve a PIX charge via the banking provider', async () => {
    const result = await sut.execute({
      txId: 'tx-abc-123',
      bankAccountId: 'bank-account-1',
    });

    expect(result.pixCharge).toBeDefined();
    expect(result.pixCharge.txId).toBe('tx-abc-123');
    expect(result.pixCharge.status).toBe('ACTIVE');
    expect(result.pixCharge.amount).toBe(250.0);
    expect(mockProvider.authenticate).toHaveBeenCalledOnce();
    expect(mockProvider.getPixCharge).toHaveBeenCalledWith('tx-abc-123');
    expect(getProvider).toHaveBeenCalledWith('bank-account-1');
  });

  it('should throw when provider fails to authenticate', async () => {
    vi.mocked(mockProvider.authenticate).mockRejectedValueOnce(
      new Error('Authentication failed'),
    );

    await expect(
      sut.execute({
        txId: 'tx-abc-123',
        bankAccountId: 'bank-account-1',
      }),
    ).rejects.toThrow('Authentication failed');
  });

  it('should throw when getPixCharge fails', async () => {
    vi.mocked(mockProvider.getPixCharge).mockRejectedValueOnce(
      new Error('PIX charge not found'),
    );

    await expect(
      sut.execute({
        txId: 'tx-not-found',
        bankAccountId: 'bank-account-1',
      }),
    ).rejects.toThrow('PIX charge not found');
  });

  it('should call getProvider with the correct bankAccountId', async () => {
    await sut.execute({
      txId: 'tx-test',
      bankAccountId: 'specific-account-99',
    });

    expect(getProvider).toHaveBeenCalledWith('specific-account-99');
  });
});
