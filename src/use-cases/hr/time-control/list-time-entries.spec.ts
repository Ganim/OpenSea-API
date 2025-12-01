import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TimeEntryType } from '@/entities/hr/value-objects';
import { InMemoryTimeEntriesRepository } from '@/repositories/hr/in-memory/in-memory-time-entries-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListTimeEntriesUseCase } from './list-time-entries';

let timeEntriesRepository: InMemoryTimeEntriesRepository;
let sut: ListTimeEntriesUseCase;

describe('List Time Entries Use Case', () => {
  beforeEach(() => {
    timeEntriesRepository = new InMemoryTimeEntriesRepository();
    sut = new ListTimeEntriesUseCase(timeEntriesRepository);
  });

  it('should list all time entries', async () => {
    const employeeId = new UniqueEntityID();

    // Create some entries
    await timeEntriesRepository.create({
      employeeId,
      entryType: TimeEntryType.CLOCK_IN(),
      timestamp: new Date('2024-01-15T08:00:00Z'),
    });

    await timeEntriesRepository.create({
      employeeId,
      entryType: TimeEntryType.CLOCK_OUT(),
      timestamp: new Date('2024-01-15T17:00:00Z'),
    });

    const result = await sut.execute({});

    expect(result.timeEntries).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should filter by employee', async () => {
    const employeeId1 = new UniqueEntityID();
    const employeeId2 = new UniqueEntityID();

    // Create entries for employee 1
    await timeEntriesRepository.create({
      employeeId: employeeId1,
      entryType: TimeEntryType.CLOCK_IN(),
      timestamp: new Date('2024-01-15T08:00:00Z'),
    });

    // Create entries for employee 2
    await timeEntriesRepository.create({
      employeeId: employeeId2,
      entryType: TimeEntryType.CLOCK_IN(),
      timestamp: new Date('2024-01-15T09:00:00Z'),
    });

    const result = await sut.execute({
      employeeId: employeeId1.toString(),
    });

    expect(result.timeEntries).toHaveLength(1);
    expect(result.timeEntries[0].employeeId.equals(employeeId1)).toBe(true);
  });

  it('should filter by date range', async () => {
    const employeeId = new UniqueEntityID();

    // Entry within range
    await timeEntriesRepository.create({
      employeeId,
      entryType: TimeEntryType.CLOCK_IN(),
      timestamp: new Date('2024-01-15T08:00:00Z'),
    });

    // Entry outside range
    await timeEntriesRepository.create({
      employeeId,
      entryType: TimeEntryType.CLOCK_IN(),
      timestamp: new Date('2024-01-20T08:00:00Z'),
    });

    const result = await sut.execute({
      startDate: new Date('2024-01-14T00:00:00Z'),
      endDate: new Date('2024-01-16T23:59:59Z'),
    });

    expect(result.timeEntries).toHaveLength(1);
  });

  it('should filter by entry type', async () => {
    const employeeId = new UniqueEntityID();

    await timeEntriesRepository.create({
      employeeId,
      entryType: TimeEntryType.CLOCK_IN(),
      timestamp: new Date('2024-01-15T08:00:00Z'),
    });

    await timeEntriesRepository.create({
      employeeId,
      entryType: TimeEntryType.CLOCK_OUT(),
      timestamp: new Date('2024-01-15T17:00:00Z'),
    });

    const result = await sut.execute({
      entryType: 'CLOCK_IN',
    });

    expect(result.timeEntries).toHaveLength(1);
    expect(result.timeEntries[0].entryType.value).toBe('CLOCK_IN');
  });

  it('should throw error for invalid entry type', async () => {
    await expect(
      sut.execute({
        entryType: 'INVALID_TYPE',
      }),
    ).rejects.toThrow('Invalid entry type: INVALID_TYPE');
  });

  it('should return empty array when no entries found', async () => {
    const result = await sut.execute({});

    expect(result.timeEntries).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
