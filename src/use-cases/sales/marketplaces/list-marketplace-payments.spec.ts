import { describe, expect, it } from 'vitest';
import { ListMarketplacePaymentsUseCase } from './list-marketplace-payments';

describe('ListMarketplacePaymentsUseCase', () => {
  it('should throw not implemented error', async () => {
    const sut = new ListMarketplacePaymentsUseCase();

    await expect(sut.execute({})).rejects.toThrow('not implemented');
  });
});
