import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemorySchedulesRepository } from '@/repositories/production/in-memory/in-memory-schedules-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateScheduleEntryUseCase } from './create-schedule-entry';
import { CreateScheduleUseCase } from './create-schedule';
import { DeleteScheduleEntryUseCase } from './delete-schedule-entry';

let schedulesRepository: InMemorySchedulesRepository;
let createSchedule: CreateScheduleUseCase;
let createEntry: CreateScheduleEntryUseCase;
let sut: DeleteScheduleEntryUseCase;

describe('DeleteScheduleEntryUseCase', () => {
  beforeEach(() => {
    schedulesRepository = new InMemorySchedulesRepository();
    createSchedule = new CreateScheduleUseCase(schedulesRepository);
    createEntry = new CreateScheduleEntryUseCase(schedulesRepository);
    sut = new DeleteScheduleEntryUseCase(schedulesRepository);
  });

  it('should delete a schedule entry', async () => {
    const { schedule } = await createSchedule.execute({
      tenantId: 'tenant-1',
      name: 'Q1 Schedule',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-03-31'),
    });

    const { entry } = await createEntry.execute({
      scheduleId: schedule.id.toString(),
      title: 'Batch A',
      startDate: new Date('2026-01-15T08:00:00Z'),
      endDate: new Date('2026-01-15T16:00:00Z'),
    });

    await sut.execute({ id: entry.id.toString() });

    expect(schedulesRepository.entries).toHaveLength(0);
  });

  it('should throw error if schedule entry does not exist', async () => {
    await expect(() =>
      sut.execute({ id: 'non-existent-id' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
