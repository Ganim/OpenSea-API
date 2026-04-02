import { describe, expect, it } from 'vitest';
import { AcknowledgeMarketplaceOrderUseCase } from './acknowledge-marketplace-order';

describe('AcknowledgeMarketplaceOrderUseCase', () => {
  it('should throw not implemented error', async () => {
    const sut = new AcknowledgeMarketplaceOrderUseCase();

    await expect(sut.execute({})).rejects.toThrow('not implemented');
  });
});
