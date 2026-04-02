import { describe, expect, it } from 'vitest';
import { PublishMarketplaceListingUseCase } from './publish-marketplace-listing';

describe('PublishMarketplaceListingUseCase', () => {
  it('should throw not implemented error', async () => {
    const sut = new PublishMarketplaceListingUseCase();

    await expect(sut.execute({})).rejects.toThrow('not implemented');
  });
});
