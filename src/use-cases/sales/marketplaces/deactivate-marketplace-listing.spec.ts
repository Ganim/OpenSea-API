import { describe, expect, it } from 'vitest';
import { DeactivateMarketplaceListingUseCase } from './deactivate-marketplace-listing';

describe('DeactivateMarketplaceListingUseCase', () => {
  it('should throw not implemented error', async () => {
    const sut = new DeactivateMarketplaceListingUseCase();

    await expect(sut.execute({})).rejects.toThrow('not implemented');
  });
});
