import { beforeEach, describe, expect, it } from 'vitest';
import { GetBidContractByIdUseCase } from './get-bid-contract-by-id';

let sut: GetBidContractByIdUseCase;

describe('GetBidContractByIdUseCase', () => {
  beforeEach(() => {
    sut = new GetBidContractByIdUseCase();
  });

  it('should throw not implemented error', async () => {
    await expect(() => sut.execute({})).rejects.toThrow(
      'GetBidContractByIdUseCase not implemented',
    );
  });
});
