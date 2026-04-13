import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemorySchedulesRepository } from '@/repositories/production/in-memory/in-memory-schedules-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateScheduleUseCase } from './create-schedule';
import { GetScheduleByIdUseCase } from './get-schedule-by-id';

let schedulesRepository: InMemorySchedulesRepository;
let createSchedule: CreateScheduleUseCase;
let sut: GetScheduleByIdUseCase;

describe('GetScheduleByIdUseCase', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    schedulesRepository = new InMemorySchedulesRepository();
    createSchedule = new CreateScheduleUseCase(schedulesRepository);
    sut = new GetScheduleByIdUseCase(schedulesRepository);
  });

  it('should get a schedule by id', async () => {
    const { schedule: created } = await createSchedule.execute({
      tenantId: TENANT_ID,
      name: 'Q1 Schedule',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-03-31'),
    });

    const { schedule } = await sut.execute({
      scheduleId: created.id.toString(),
      tenantId: TENANT_ID,
    });

    expect(schedule).toEqual(created);
  });

  it('should throw error if schedule does not exist', async () => {
    await expect(() =>
      sut.execute({
        scheduleId: 'non-existent-id',
        tenantId: TENANT_ID,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw error if schedule belongs to different tenant', async () => {
    const { schedule: created } = await createSchedule.execute({
      tenantId: 'tenant-2',
      name: 'Other Schedule',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-03-31'),
    });

    await expect(() =>
      sut.execute({
        scheduleId: created.id.toString(),
        tenantId: TENANT_ID,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
