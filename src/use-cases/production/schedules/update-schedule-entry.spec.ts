import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemorySchedulesRepository } from '@/repositories/production/in-memory/in-memory-schedules-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateScheduleEntryUseCase } from './create-schedule-entry';
import { CreateScheduleUseCase } from './create-schedule';
import { UpdateScheduleEntryUseCase } from './update-schedule-entry';

let schedulesRepository: InMemorySchedulesRepository;
let createSchedule: CreateScheduleUseCase;
let createEntry: CreateScheduleEntryUseCase;
let sut: UpdateScheduleEntryUseCase;

describe('UpdateScheduleEntryUseCase', () => {
  let scheduleId: string;

  beforeEach(async () => {
    schedulesRepository = new InMemorySchedulesRepository();
    createSchedule = new CreateScheduleUseCase(schedulesRepository);
    createEntry = new CreateScheduleEntryUseCase(schedulesRepository);
    sut = new UpdateScheduleEntryUseCase(schedulesRepository);

    const { schedule } = await createSchedule.execute({
      tenantId: 'tenant-1',
      name: 'Q1 Schedule',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-03-31'),
    });
    scheduleId = schedule.id.toString();
  });

  it('should update a schedule entry', async () => {
    const { entry: created } = await createEntry.execute({
      scheduleId,
      title: 'Batch A',
      startDate: new Date('2026-01-15T08:00:00Z'),
      endDate: new Date('2026-01-15T16:00:00Z'),
    });

    const { entry } = await sut.execute({
      id: created.id.toString(),
      title: 'Updated Batch A',
      status: 'CONFIRMED',
      color: '#00FF00',
      notes: 'Confirmed by manager',
    });

    expect(entry.title).toBe('Updated Batch A');
    expect(entry.status).toBe('CONFIRMED');
    expect(entry.color).toBe('#00FF00');
    expect(entry.notes).toBe('Confirmed by manager');
  });

  it('should update dates', async () => {
    const { entry: created } = await createEntry.execute({
      scheduleId,
      title: 'Batch A',
      startDate: new Date('2026-01-15T08:00:00Z'),
      endDate: new Date('2026-01-15T16:00:00Z'),
    });

    const newStart = new Date('2026-01-20T09:00:00Z');
    const newEnd = new Date('2026-01-20T17:00:00Z');

    const { entry } = await sut.execute({
      id: created.id.toString(),
      startDate: newStart,
      endDate: newEnd,
    });

    expect(entry.startDate).toEqual(newStart);
    expect(entry.endDate).toEqual(newEnd);
  });

  it('should throw error if entry does not exist', async () => {
    await expect(() =>
      sut.execute({
        id: 'non-existent-id',
        title: 'Updated',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should clear optional fields with null', async () => {
    const { entry: created } = await createEntry.execute({
      scheduleId,
      workstationId: 'ws-1',
      title: 'Batch A',
      startDate: new Date('2026-01-15T08:00:00Z'),
      endDate: new Date('2026-01-15T16:00:00Z'),
      color: '#FF0000',
      notes: 'Some notes',
    });

    const { entry } = await sut.execute({
      id: created.id.toString(),
      workstationId: null,
      color: null,
      notes: null,
    });

    expect(entry.workstationId).toBeNull();
    expect(entry.color).toBeNull();
    expect(entry.notes).toBeNull();
  });
});
