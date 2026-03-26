import { beforeEach, describe, expect, it } from 'vitest';
import { ListBidEmpenhosUseCase } from './list-bid-empenhos';

let sut: ListBidEmpenhosUseCase;

describe('ListBidEmpenhosUseCase', () => {
  beforeEach(() => {
    sut = new ListBidEmpenhosUseCase();
  });

  it('should throw not implemented error', async () => {
    await expect(() => sut.execute({})).rejects.toThrow(
      'ListBidEmpenhosUseCase not implemented',
    );
  });
});
