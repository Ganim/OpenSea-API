import { describe, expect, it } from 'vitest';
import { GetMarketplaceConnectionByIdUseCase } from './get-marketplace-connection-by-id';

describe('GetMarketplaceConnectionByIdUseCase', () => {
  it('should throw not implemented error', async () => {
    const sut = new GetMarketplaceConnectionByIdUseCase();

    await expect(sut.execute({})).rejects.toThrow('not implemented');
  });
});
