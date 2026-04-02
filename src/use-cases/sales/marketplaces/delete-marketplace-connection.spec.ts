import { describe, expect, it } from 'vitest';
import { DeleteMarketplaceConnectionUseCase } from './delete-marketplace-connection';

describe('DeleteMarketplaceConnectionUseCase', () => {
  it('should throw not implemented error', async () => {
    const sut = new DeleteMarketplaceConnectionUseCase();

    await expect(sut.execute({})).rejects.toThrow('not implemented');
  });
});
