import { describe, expect, it } from 'vitest';
import { ListMarketplaceListingsUseCase } from './list-marketplace-listings';

describe('ListMarketplaceListingsUseCase', () => {
  it('should throw not implemented error', async () => {
    const sut = new ListMarketplaceListingsUseCase();

    await expect(sut.execute({})).rejects.toThrow('not implemented');
  });
});
