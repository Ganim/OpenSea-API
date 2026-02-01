import { InMemoryBinsRepository } from '@/repositories/stock/in-memory/in-memory-bins-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { SearchBinsUseCase } from './search-bins';

let binsRepository: InMemoryBinsRepository;
let sut: SearchBinsUseCase;

describe('SearchBinsUseCase', () => {
  beforeEach(() => {
    binsRepository = new InMemoryBinsRepository();
    sut = new SearchBinsUseCase(binsRepository);
  });

  it('should return empty array for empty query', async () => {
    const { bins } = await sut.execute({ query: '' });
    expect(bins).toHaveLength(0);
  });

  it('should return empty array for whitespace-only query', async () => {
    const { bins } = await sut.execute({ query: '   ' });
    expect(bins).toHaveLength(0);
  });
});
