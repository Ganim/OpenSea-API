import { beforeEach, describe, expect, it } from 'vitest';
import { ChangeBidStatusUseCase } from './change-bid-status';

let sut: ChangeBidStatusUseCase;

describe('ChangeBidStatusUseCase', () => {
  beforeEach(() => {
    sut = new ChangeBidStatusUseCase();
  });

  it('should throw not implemented error', async () => {
    await expect(() => sut.execute({})).rejects.toThrow(
      'ChangeBidStatusUseCase not implemented',
    );
  });
});
