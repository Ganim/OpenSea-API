import { InMemoryWorkSchedulesRepository } from '@/repositories/hr/in-memory/in-memory-work-schedules-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListWorkSchedulesUseCase } from './list-work-schedules';

let workSchedulesRepository: InMemoryWorkSchedulesRepository;
let sut: ListWorkSchedulesUseCase;

describe('ListWorkSchedulesUseCase', () => {
  beforeEach(() => {
    workSchedulesRepository = new InMemoryWorkSchedulesRepository();
    sut = new ListWorkSchedulesUseCase(workSchedulesRepository);
  });

  it('should return empty list when no work schedules exist', async () => {
    const { workSchedules, total } = await sut.execute({});
    expect(workSchedules).toHaveLength(0);
    expect(total).toBe(0);
  });
});
