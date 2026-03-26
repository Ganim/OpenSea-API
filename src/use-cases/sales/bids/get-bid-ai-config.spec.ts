import { beforeEach, describe, expect, it } from 'vitest';
import { GetBidAiConfigUseCase } from './get-bid-ai-config';

let sut: GetBidAiConfigUseCase;

describe('GetBidAiConfigUseCase', () => {
  beforeEach(() => {
    sut = new GetBidAiConfigUseCase();
  });

  it('should throw not implemented error', async () => {
    await expect(() => sut.execute({})).rejects.toThrow(
      'GetBidAiConfigUseCase not implemented',
    );
  });
});
