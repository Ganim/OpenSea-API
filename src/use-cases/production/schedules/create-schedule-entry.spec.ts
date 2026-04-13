import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemorySchedulesRepository } from '@/repositories/production/in-memory/in-memory-schedules-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateScheduleEntryUseCase } from './create-schedule-entry';
import { CreateScheduleUseCase } from './create-schedule';

let schedulesRepository: InMemorySchedulesRepository;
let createSchedule: CreateScheduleUseCase;
let sut: CreateScheduleEntryUseCase;

describe('CreateScheduleEntryUseCase', () => {
  beforeEach(() => {
    schedulesRepository = new InMemorySchedulesRepository();
    createSchedule = new CreateScheduleUseCase(schedulesRepository);
    sut = new CreateScheduleEntryUseCase(schedulesRepository);
  });

  it('should create a schedule entry', async () => {
    const { schedule } = await createSchedule.execute({
      tenantId: 'tenant-1',
      name: 'Q1 Schedule',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-03-31'),
    });

    const { entry } = await sut.execute({
      scheduleId: schedule.id.toString(),
      title: 'Produce batch A',
      startDate: new Date('2026-01-15T08:00:00Z'),
      endDate: new Date('2026-01-15T16:00:00Z'),
    });

    expect(entry.id.toString()).toEqual(expect.any(String));
    expect(entry.title).toBe('Produce batch A');
    expect(entry.status).toBe('PLANNED');
    expect(entry.productionOrderId).toBeNull();
    expect(entry.workstationId).toBeNull();
  });

  it('should create an entry with all optional fields', async () => {
    const { schedule } = await createSchedule.execute({
      tenantId: 'tenant-1',
      name: 'Q1 Schedule',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-03-31'),
    });

    const { entry } = await sut.execute({
      scheduleId: schedule.id.toString(),
      productionOrderId: 'order-1',
      workstationId: 'ws-1',
      title: 'Produce batch B',
      startDate: new Date('2026-01-16T08:00:00Z'),
      endDate: new Date('2026-01-16T16:00:00Z'),
      color: '#FF5733',
      notes: 'Priority batch',
    });

    expect(entry.productionOrderId?.toString()).toBe('order-1');
    expect(entry.workstationId?.toString()).toBe('ws-1');
    expect(entry.color).toBe('#FF5733');
    expect(entry.notes).toBe('Priority batch');
  });

  it('should throw error if end date is before start date', async () => {
    const { schedule } = await createSchedule.execute({
      tenantId: 'tenant-1',
      name: 'Q1 Schedule',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-03-31'),
    });

    await expect(() =>
      sut.execute({
        scheduleId: schedule.id.toString(),
        title: 'Invalid entry',
        startDate: new Date('2026-01-15T16:00:00Z'),
        endDate: new Date('2026-01-15T08:00:00Z'),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw error if end date equals start date', async () => {
    const { schedule } = await createSchedule.execute({
      tenantId: 'tenant-1',
      name: 'Q1 Schedule',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-03-31'),
    });

    const sameDate = new Date('2026-01-15T08:00:00Z');

    await expect(() =>
      sut.execute({
        scheduleId: schedule.id.toString(),
        title: 'Zero duration entry',
        startDate: sameDate,
        endDate: sameDate,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
