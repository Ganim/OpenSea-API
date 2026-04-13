import { InMemoryJobCardsRepository } from '@/repositories/production/in-memory/in-memory-job-cards-repository';
import { InMemoryTimeEntriesRepository } from '@/repositories/production/in-memory/in-memory-time-entries-repository';
import { CreateTimeEntryUseCase } from './create-time-entry';

let timeEntriesRepository: InMemoryTimeEntriesRepository;
let jobCardsRepository: InMemoryJobCardsRepository;
let sut: CreateTimeEntryUseCase;

describe('CreateTimeEntryUseCase', () => {
  beforeEach(async () => {
    timeEntriesRepository = new InMemoryTimeEntriesRepository();
    jobCardsRepository = new InMemoryJobCardsRepository();
    sut = new CreateTimeEntryUseCase(timeEntriesRepository, jobCardsRepository);

    // Create an IN_PROGRESS job card for tests
    await jobCardsRepository.create({
      productionOrderId: 'order-1',
      operationRoutingId: 'routing-1',
      status: 'IN_PROGRESS',
      quantityPlanned: 100,
    });
  });

  it('should create a time entry with default values', async () => {
    const jobCard = jobCardsRepository.items[0];
    const { timeEntry } = await sut.execute({
      jobCardId: jobCard.jobCardId.toString(),
      operatorId: 'operator-1',
      startTime: new Date('2026-04-13T08:00:00Z'),
    });

    expect(timeEntry.jobCardId.toString()).toBe(jobCard.jobCardId.toString());
    expect(timeEntry.operatorId.toString()).toBe('operator-1');
    expect(timeEntry.entryType).toBe('PRODUCTION');
    expect(timeEntry.breakMinutes).toBe(0);
    expect(timeEntry.endTime).toBeNull();
    expect(timeEntry.durationMinutes).toBeNull();
    expect(timeEntriesRepository.items).toHaveLength(1);
  });

  it('should create a time entry with endTime and compute duration', async () => {
    const jobCard = jobCardsRepository.items[0];
    const { timeEntry } = await sut.execute({
      jobCardId: jobCard.jobCardId.toString(),
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
    const jobCard = jobCardsRepository.items[0];
    const { timeEntry } = await sut.execute({
      jobCardId: jobCard.jobCardId.toString(),
      operatorId: 'operator-1',
      startTime: new Date('2026-04-13T14:00:00Z'),
      entryType: 'REWORK',
    });

    expect(timeEntry.entryType).toBe('REWORK');
  });

  it('should throw if job card not found', async () => {
    await expect(
      sut.execute({
        jobCardId: 'non-existent',
        operatorId: 'operator-1',
        startTime: new Date(),
      }),
    ).rejects.toThrow('Job card not found');
  });

  it('should throw if job card is not IN_PROGRESS', async () => {
    await jobCardsRepository.create({
      productionOrderId: 'order-2',
      operationRoutingId: 'routing-2',
      status: 'PENDING',
      quantityPlanned: 50,
    });
    const pendingCard = jobCardsRepository.items[1];

    await expect(
      sut.execute({
        jobCardId: pendingCard.jobCardId.toString(),
        operatorId: 'operator-1',
        startTime: new Date(),
      }),
    ).rejects.toThrow('Job card must be IN_PROGRESS');
  });

  it('should throw if endTime is before startTime', async () => {
    const jobCard = jobCardsRepository.items[0];
    await expect(
      sut.execute({
        jobCardId: jobCard.jobCardId.toString(),
        operatorId: 'operator-1',
        startTime: new Date('2026-04-13T10:00:00Z'),
        endTime: new Date('2026-04-13T08:00:00Z'),
      }),
    ).rejects.toThrow('End time must be after start time');
  });
});
