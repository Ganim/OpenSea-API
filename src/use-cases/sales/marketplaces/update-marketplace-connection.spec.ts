import { describe, expect, it } from 'vitest';
import { UpdateMarketplaceConnectionUseCase } from './update-marketplace-connection';

describe('UpdateMarketplaceConnectionUseCase', () => {
  it('should throw not implemented error', async () => {
    const sut = new UpdateMarketplaceConnectionUseCase();

    await expect(sut.execute({})).rejects.toThrow('not implemented');
  });
});
