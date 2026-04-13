import { InMemorySchedulesRepository } from '@/repositories/production/in-memory/in-memory-schedules-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateScheduleUseCase } from './create-schedule';
import { ListSchedulesUseCase } from './list-schedules';

let schedulesRepository: InMemorySchedulesRepository;
let createSchedule: CreateScheduleUseCase;
let sut: ListSchedulesUseCase;

describe('ListSchedulesUseCase', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    schedulesRepository = new InMemorySchedulesRepository();
    createSchedule = new CreateScheduleUseCase(schedulesRepository);
    sut = new ListSchedulesUseCase(schedulesRepository);
  });

  it('should return empty list when no schedules exist', async () => {
    const { schedules } = await sut.execute({ tenantId: TENANT_ID });

    expect(schedules).toHaveLength(0);
  });

  it('should list all schedules for a tenant', async () => {
    await createSchedule.execute({
      tenantId: TENANT_ID,
      name: 'Q1 Schedule',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-03-31'),
    });

    await createSchedule.execute({
      tenantId: TENANT_ID,
      name: 'Q2 Schedule',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-06-30'),
    });

    const { schedules } = await sut.execute({ tenantId: TENANT_ID });

    expect(schedules).toHaveLength(2);
  });

  it('should not list schedules from other tenants', async () => {
    await createSchedule.execute({
      tenantId: 'tenant-1',
      name: 'Schedule A',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-03-31'),
    });

    await createSchedule.execute({
      tenantId: 'tenant-2',
      name: 'Schedule B',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-03-31'),
    });

    const { schedules } = await sut.execute({ tenantId: 'tenant-1' });

    expect(schedules).toHaveLength(1);
    expect(schedules[0].name).toBe('Schedule A');
  });
});
