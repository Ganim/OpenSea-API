import { InMemoryOvertimeRepository } from '@/repositories/hr/in-memory/in-memory-overtime-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListOvertimeUseCase } from './list-overtime';

let overtimeRepository: InMemoryOvertimeRepository;
let sut: ListOvertimeUseCase;

describe('ListOvertimeUseCase', () => {
  beforeEach(() => {
    overtimeRepository = new InMemoryOvertimeRepository();
    sut = new ListOvertimeUseCase(overtimeRepository);
  });

  it('should return empty list when no overtimes exist', async () => {
    const { overtimes, total } = await sut.execute({});
    expect(overtimes).toHaveLength(0);
    expect(total).toBe(0);
  });
});
