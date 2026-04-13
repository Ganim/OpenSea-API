import { InMemoryDowntimeRecordsRepository } from '@/repositories/production/in-memory/in-memory-downtime-records-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateDowntimeRecordUseCase } from './create-downtime-record';

let downtimeRecordsRepository: InMemoryDowntimeRecordsRepository;
let sut: CreateDowntimeRecordUseCase;

describe('CreateDowntimeRecordUseCase', () => {
  beforeEach(() => {
    downtimeRecordsRepository = new InMemoryDowntimeRecordsRepository();
    sut = new CreateDowntimeRecordUseCase(downtimeRecordsRepository);
  });

  it('should create a downtime record without end time', async () => {
    const startTime = new Date('2026-01-15T08:00:00Z');

    const { downtimeRecord } = await sut.execute({
      workstationId: 'ws-1',
      downtimeReasonId: 'reason-1',
      startTime,
      reportedById: 'user-1',
    });

    expect(downtimeRecord.id.toString()).toEqual(expect.any(String));
    expect(downtimeRecord.workstationId.toString()).toBe('ws-1');
    expect(downtimeRecord.downtimeReasonId.toString()).toBe('reason-1');
    expect(downtimeRecord.startTime).toEqual(startTime);
    expect(downtimeRecord.endTime).toBeNull();
    expect(downtimeRecord.durationMinutes).toBeNull();
  });

  it('should create a downtime record with end time and calculate duration', async () => {
    const startTime = new Date('2026-01-15T08:00:00Z');
    const endTime = new Date('2026-01-15T09:30:00Z');

    const { downtimeRecord } = await sut.execute({
      workstationId: 'ws-1',
      downtimeReasonId: 'reason-1',
      startTime,
      endTime,
      reportedById: 'user-1',
    });

    expect(downtimeRecord.endTime).toEqual(endTime);
    expect(downtimeRecord.durationMinutes).toBe(90);
  });

  it('should create a downtime record with notes', async () => {
    const { downtimeRecord } = await sut.execute({
      workstationId: 'ws-1',
      downtimeReasonId: 'reason-1',
      startTime: new Date(),
      reportedById: 'user-1',
      notes: 'Machine overheating',
    });

    expect(downtimeRecord.notes).toBe('Machine overheating');
  });
});
