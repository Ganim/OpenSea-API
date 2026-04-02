import { describe, expect, it } from 'vitest';
import { ListMarketplaceOrdersUseCase } from './list-marketplace-orders';

describe('ListMarketplaceOrdersUseCase', () => {
  it('should throw not implemented error', async () => {
    const sut = new ListMarketplaceOrdersUseCase();

    await expect(sut.execute({})).rejects.toThrow('not implemented');
  });
});
