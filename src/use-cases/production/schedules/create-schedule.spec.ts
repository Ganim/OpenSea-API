import { InMemorySchedulesRepository } from '@/repositories/production/in-memory/in-memory-schedules-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateScheduleUseCase } from './create-schedule';

let schedulesRepository: InMemorySchedulesRepository;
let sut: CreateScheduleUseCase;

describe('CreateScheduleUseCase', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    schedulesRepository = new InMemorySchedulesRepository();
    sut = new CreateScheduleUseCase(schedulesRepository);
  });

  it('should create a schedule', async () => {
    const startDate = new Date('2026-01-01');
    const endDate = new Date('2026-03-31');

    const { schedule } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Q1 Production Schedule',
      description: 'First quarter schedule',
      startDate,
      endDate,
    });

    expect(schedule.id.toString()).toEqual(expect.any(String));
    expect(schedule.name).toBe('Q1 Production Schedule');
    expect(schedule.description).toBe('First quarter schedule');
    expect(schedule.startDate).toEqual(startDate);
    expect(schedule.endDate).toEqual(endDate);
    expect(schedule.isActive).toBe(true);
  });

  it('should create a schedule without description', async () => {
    const { schedule } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Weekly Schedule',
      startDate: new Date('2026-01-06'),
      endDate: new Date('2026-01-12'),
    });

    expect(schedule.description).toBeNull();
  });
});
