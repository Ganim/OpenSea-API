import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetConnectTokenUseCase } from './get-connect-token';
import type { BankingProvider } from '@/services/banking/pluggy-provider.interface';

let mockBankingProvider: BankingProvider;
let sut: GetConnectTokenUseCase;

describe('GetConnectTokenUseCase', () => {
  beforeEach(() => {
    mockBankingProvider = {
      providerName: 'PLUGGY',
      createConnectToken: vi.fn().mockResolvedValue({
        accessToken: 'test-widget-token-123',
      }),
      getItem: vi.fn(),
      getAccounts: vi.fn(),
      getTransactions: vi.fn(),
    };

    sut = new GetConnectTokenUseCase(mockBankingProvider);
  });

  it('should return a connect widget token', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
    });

    expect(result.accessToken).toBe('test-widget-token-123');
    expect(mockBankingProvider.createConnectToken).toHaveBeenCalledWith({
      clientUserId: 'tenant-1:user-1',
    });
  });

  it('should propagate provider errors', async () => {
    (mockBankingProvider.createConnectToken as ReturnType<typeof vi.fn>)
      .mockRejectedValue(new Error('Provider unavailable'));

    await expect(
      sut.execute({ tenantId: 'tenant-1', userId: 'user-1' }),
    ).rejects.toThrow('Provider unavailable');
  });
});
