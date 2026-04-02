import { describe, expect, it } from 'vitest';
import { GetMarketplaceReconciliationUseCase } from './get-marketplace-reconciliation';

describe('GetMarketplaceReconciliationUseCase', () => {
  it('should throw not implemented error', async () => {
    const sut = new GetMarketplaceReconciliationUseCase();

    await expect(sut.execute({})).rejects.toThrow('not implemented');
  });
});
