import { describe, expect, it } from 'vitest';
import { ListMarketplaceConnectionsUseCase } from './list-marketplace-connections';

describe('ListMarketplaceConnectionsUseCase', () => {
  it('should throw not implemented error', async () => {
    const sut = new ListMarketplaceConnectionsUseCase();

    await expect(sut.execute({})).rejects.toThrow('not implemented');
  });
});
