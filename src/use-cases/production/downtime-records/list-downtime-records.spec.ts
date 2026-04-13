import { InMemoryDowntimeRecordsRepository } from '@/repositories/production/in-memory/in-memory-downtime-records-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateDowntimeRecordUseCase } from './create-downtime-record';
import { ListDowntimeRecordsUseCase } from './list-downtime-records';

let downtimeRecordsRepository: InMemoryDowntimeRecordsRepository;
let createDowntimeRecord: CreateDowntimeRecordUseCase;
let sut: ListDowntimeRecordsUseCase;

describe('ListDowntimeRecordsUseCase', () => {
  beforeEach(() => {
    downtimeRecordsRepository = new InMemoryDowntimeRecordsRepository();
    createDowntimeRecord = new CreateDowntimeRecordUseCase(
      downtimeRecordsRepository,
    );
    sut = new ListDowntimeRecordsUseCase(downtimeRecordsRepository);
  });

  it('should return empty list when no records exist', async () => {
    const { downtimeRecords } = await sut.execute({
      workstationId: 'ws-1',
    });

    expect(downtimeRecords).toHaveLength(0);
  });

  it('should list downtime records by workstation', async () => {
    await createDowntimeRecord.execute({
      workstationId: 'ws-1',
      downtimeReasonId: 'reason-1',
      startTime: new Date('2026-01-15T08:00:00Z'),
      reportedById: 'user-1',
    });

    await createDowntimeRecord.execute({
      workstationId: 'ws-1',
      downtimeReasonId: 'reason-2',
      startTime: new Date('2026-01-15T10:00:00Z'),
      reportedById: 'user-1',
    });

    await createDowntimeRecord.execute({
      workstationId: 'ws-2',
      downtimeReasonId: 'reason-1',
      startTime: new Date('2026-01-15T08:00:00Z'),
      reportedById: 'user-1',
    });

    const { downtimeRecords } = await sut.execute({
      workstationId: 'ws-1',
    });

    expect(downtimeRecords).toHaveLength(2);
  });

  it('should filter by date range', async () => {
    await createDowntimeRecord.execute({
      workstationId: 'ws-1',
      downtimeReasonId: 'reason-1',
      startTime: new Date('2026-01-10T08:00:00Z'),
      reportedById: 'user-1',
    });

    await createDowntimeRecord.execute({
      workstationId: 'ws-1',
      downtimeReasonId: 'reason-2',
      startTime: new Date('2026-01-15T08:00:00Z'),
      reportedById: 'user-1',
    });

    await createDowntimeRecord.execute({
      workstationId: 'ws-1',
      downtimeReasonId: 'reason-3',
      startTime: new Date('2026-01-20T08:00:00Z'),
      reportedById: 'user-1',
    });

    const { downtimeRecords } = await sut.execute({
      workstationId: 'ws-1',
      startDate: new Date('2026-01-12T00:00:00Z'),
      endDate: new Date('2026-01-18T00:00:00Z'),
    });

    expect(downtimeRecords).toHaveLength(1);
  });
});
