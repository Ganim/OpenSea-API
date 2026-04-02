import { describe, expect, it } from 'vitest';
import { CreateMarketplaceConnectionUseCase } from './create-marketplace-connection';

describe('CreateMarketplaceConnectionUseCase', () => {
  it('should throw not implemented error', async () => {
    const sut = new CreateMarketplaceConnectionUseCase();

    await expect(sut.execute({})).rejects.toThrow('not implemented');
  });
});
