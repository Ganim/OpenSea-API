import { InMemoryTimeBankRepository } from '@/repositories/hr/in-memory/in-memory-time-bank-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListTimeBanksUseCase } from './list-time-banks';

let timeBankRepository: InMemoryTimeBankRepository;
let sut: ListTimeBanksUseCase;

describe('ListTimeBanksUseCase', () => {
  beforeEach(() => {
    timeBankRepository = new InMemoryTimeBankRepository();
    sut = new ListTimeBanksUseCase(timeBankRepository);
  });

  it('should return empty list when no time banks exist', async () => {
    const { timeBanks, total } = await sut.execute({ tenantId: 'tenant-1' });
    expect(timeBanks).toHaveLength(0);
    expect(total).toBe(0);
  });
});
