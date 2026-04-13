import { InMemoryTimeEntriesRepository } from '@/repositories/production/in-memory/in-memory-time-entries-repository';
import { ListTimeEntriesUseCase } from './list-time-entries';

let timeEntriesRepository: InMemoryTimeEntriesRepository;
let sut: ListTimeEntriesUseCase;

describe('ListTimeEntriesUseCase', () => {
  beforeEach(() => {
    timeEntriesRepository = new InMemoryTimeEntriesRepository();
    sut = new ListTimeEntriesUseCase(timeEntriesRepository);
  });

  it('should list time entries by job card id', async () => {
    await timeEntriesRepository.create({
      jobCardId: 'job-card-1',
      operatorId: 'operator-1',
      startTime: new Date('2026-04-13T08:00:00Z'),
    });

    await timeEntriesRepository.create({
      jobCardId: 'job-card-1',
      operatorId: 'operator-2',
      startTime: new Date('2026-04-13T09:00:00Z'),
    });

    await timeEntriesRepository.create({
      jobCardId: 'job-card-2',
      operatorId: 'operator-1',
      startTime: new Date('2026-04-13T10:00:00Z'),
    });

    const { timeEntries } = await sut.execute({ jobCardId: 'job-card-1' });

    expect(timeEntries).toHaveLength(2);
  });

  it('should return empty array when no entries exist for job card', async () => {
    const { timeEntries } = await sut.execute({ jobCardId: 'non-existent' });

    expect(timeEntries).toHaveLength(0);
  });
});
