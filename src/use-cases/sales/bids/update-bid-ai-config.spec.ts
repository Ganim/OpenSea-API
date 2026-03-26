import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateBidAiConfigUseCase } from './update-bid-ai-config';

let sut: UpdateBidAiConfigUseCase;

describe('UpdateBidAiConfigUseCase', () => {
  beforeEach(() => {
    sut = new UpdateBidAiConfigUseCase();
  });

  it('should throw not implemented error', async () => {
    await expect(() => sut.execute({})).rejects.toThrow(
      'UpdateBidAiConfigUseCase not implemented',
    );
  });
});
