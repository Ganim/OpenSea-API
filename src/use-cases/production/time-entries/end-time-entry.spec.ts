import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryTimeEntriesRepository } from '@/repositories/production/in-memory/in-memory-time-entries-repository';
import { EndTimeEntryUseCase } from './end-time-entry';

let timeEntriesRepository: InMemoryTimeEntriesRepository;
let sut: EndTimeEntryUseCase;

describe('EndTimeEntryUseCase', () => {
  beforeEach(() => {
    timeEntriesRepository = new InMemoryTimeEntriesRepository();
    sut = new EndTimeEntryUseCase(timeEntriesRepository);
  });

  it('should end a time entry', async () => {
    const created = await timeEntriesRepository.create({
      jobCardId: 'job-card-1',
      operatorId: 'operator-1',
      startTime: new Date('2026-04-13T08:00:00Z'),
    });

    const { timeEntry } = await sut.execute({
      id: created.timeEntryId.toString(),
      endTime: new Date('2026-04-13T10:00:00Z'),
    });

    expect(timeEntry.endTime).toEqual(new Date('2026-04-13T10:00:00Z'));
    expect(timeEntry.durationMinutes).toBe(120);
  });

  it('should use current date when no endTime is provided', async () => {
    const created = await timeEntriesRepository.create({
      jobCardId: 'job-card-1',
      operatorId: 'operator-1',
      startTime: new Date('2026-04-13T08:00:00Z'),
    });

    const { timeEntry } = await sut.execute({
      id: created.timeEntryId.toString(),
    });

    expect(timeEntry.endTime).toBeTruthy();
  });

  it('should throw ResourceNotFoundError for non-existent entry', async () => {
    await expect(sut.execute({ id: 'non-existent' })).rejects.toBeInstanceOf(
      ResourceNotFoundError,
    );
  });

  it('should throw BadRequestError when entry is already ended', async () => {
    const created = await timeEntriesRepository.create({
      jobCardId: 'job-card-1',
      operatorId: 'operator-1',
      startTime: new Date('2026-04-13T08:00:00Z'),
      endTime: new Date('2026-04-13T10:00:00Z'),
    });

    await expect(
      sut.execute({ id: created.timeEntryId.toString() }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
