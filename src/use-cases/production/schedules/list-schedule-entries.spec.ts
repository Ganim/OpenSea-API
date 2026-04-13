import { InMemorySchedulesRepository } from '@/repositories/production/in-memory/in-memory-schedules-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateScheduleEntryUseCase } from './create-schedule-entry';
import { CreateScheduleUseCase } from './create-schedule';
import { ListScheduleEntriesUseCase } from './list-schedule-entries';

let schedulesRepository: InMemorySchedulesRepository;
let createSchedule: CreateScheduleUseCase;
let createEntry: CreateScheduleEntryUseCase;
let sut: ListScheduleEntriesUseCase;

describe('ListScheduleEntriesUseCase', () => {
  let scheduleId: string;

  beforeEach(async () => {
    schedulesRepository = new InMemorySchedulesRepository();
    createSchedule = new CreateScheduleUseCase(schedulesRepository);
    createEntry = new CreateScheduleEntryUseCase(schedulesRepository);
    sut = new ListScheduleEntriesUseCase(schedulesRepository);

    const { schedule } = await createSchedule.execute({
      tenantId: 'tenant-1',
      name: 'Q1 Schedule',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-03-31'),
    });
    scheduleId = schedule.id.toString();
  });

  it('should return empty list when no entries exist', async () => {
    const { entries } = await sut.execute({ scheduleId });

    expect(entries).toHaveLength(0);
  });

  it('should list all entries for a schedule', async () => {
    await createEntry.execute({
      scheduleId,
      title: 'Batch A',
      startDate: new Date('2026-01-15T08:00:00Z'),
      endDate: new Date('2026-01-15T16:00:00Z'),
    });

    await createEntry.execute({
      scheduleId,
      title: 'Batch B',
      startDate: new Date('2026-01-16T08:00:00Z'),
      endDate: new Date('2026-01-16T16:00:00Z'),
    });

    const { entries } = await sut.execute({ scheduleId });

    expect(entries).toHaveLength(2);
  });

  it('should filter by date range', async () => {
    await createEntry.execute({
      scheduleId,
      title: 'Early January',
      startDate: new Date('2026-01-05T08:00:00Z'),
      endDate: new Date('2026-01-05T16:00:00Z'),
    });

    await createEntry.execute({
      scheduleId,
      title: 'Mid January',
      startDate: new Date('2026-01-15T08:00:00Z'),
      endDate: new Date('2026-01-15T16:00:00Z'),
    });

    await createEntry.execute({
      scheduleId,
      title: 'Late January',
      startDate: new Date('2026-01-25T08:00:00Z'),
      endDate: new Date('2026-01-25T16:00:00Z'),
    });

    const { entries } = await sut.execute({
      scheduleId,
      startDate: new Date('2026-01-10T00:00:00Z'),
      endDate: new Date('2026-01-20T00:00:00Z'),
    });

    expect(entries).toHaveLength(1);
    expect(entries[0].title).toBe('Mid January');
  });

  it('should not list entries from other schedules', async () => {
    const { schedule: otherSchedule } = await createSchedule.execute({
      tenantId: 'tenant-1',
      name: 'Other Schedule',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-06-30'),
    });

    await createEntry.execute({
      scheduleId,
      title: 'Entry in Q1',
      startDate: new Date('2026-01-15T08:00:00Z'),
      endDate: new Date('2026-01-15T16:00:00Z'),
    });

    await createEntry.execute({
      scheduleId: otherSchedule.id.toString(),
      title: 'Entry in Q2',
      startDate: new Date('2026-04-15T08:00:00Z'),
      endDate: new Date('2026-04-15T16:00:00Z'),
    });

    const { entries } = await sut.execute({ scheduleId });

    expect(entries).toHaveLength(1);
    expect(entries[0].title).toBe('Entry in Q1');
  });
});
