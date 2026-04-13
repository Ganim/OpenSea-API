import { InMemoryTimeEntriesRepository } from '@/repositories/production/in-memory/in-memory-time-entries-repository';
import { CreateTimeEntryUseCase } from './create-time-entry';

let timeEntriesRepository: InMemoryTimeEntriesRepository;
let sut: CreateTimeEntryUseCase;

describe('CreateTimeEntryUseCase', () => {
  beforeEach(() => {
    timeEntriesRepository = new InMemoryTimeEntriesRepository();
    sut = new CreateTimeEntryUseCase(timeEntriesRepository);
  });

  it('should create a time entry with default values', async () => {
    const { timeEntry } = await sut.execute({
      jobCardId: 'job-card-1',
      operatorId: 'operator-1',
      startTime: new Date('2026-04-13T08:00:00Z'),
    });

    expect(timeEntry.jobCardId.toString()).toBe('job-card-1');
    expect(timeEntry.operatorId.toString()).toBe('operator-1');
    expect(timeEntry.entryType).toBe('PRODUCTION');
    expect(timeEntry.breakMinutes).toBe(0);
    expect(timeEntry.endTime).toBeNull();
    expect(timeEntry.durationMinutes).toBeNull();
    expect(timeEntriesRepository.items).toHaveLength(1);
  });

  it('should create a time entry with endTime and compute duration', async () => {
    const { timeEntry } = await sut.execute({
      jobCardId: 'job-card-1',
      operatorId: 'operator-1',
      startTime: new Date('2026-04-13T08:00:00Z'),
      endTime: new Date('2026-04-13T10:00:00Z'),
      breakMinutes: 15,
      entryType: 'SETUP',
      notes: 'Machine calibration',
    });

    expect(timeEntry.entryType).toBe('SETUP');
    expect(timeEntry.breakMinutes).toBe(15);
    expect(timeEntry.endTime).toBeTruthy();
    expect(timeEntry.durationMinutes).toBe(105); // 120 min - 15 break
    expect(timeEntry.notes).toBe('Machine calibration');
  });

  it('should create a time entry with REWORK type', async () => {
    const { timeEntry } = await sut.execute({
      jobCardId: 'job-card-2',
      operatorId: 'operator-1',
      startTime: new Date('2026-04-13T14:00:00Z'),
      entryType: 'REWORK',
    });

    expect(timeEntry.entryType).toBe('REWORK');
  });
});
