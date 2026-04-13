import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryDowntimeRecordsRepository } from '@/repositories/production/in-memory/in-memory-downtime-records-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateDowntimeRecordUseCase } from './create-downtime-record';
import { EndDowntimeRecordUseCase } from './end-downtime-record';

let downtimeRecordsRepository: InMemoryDowntimeRecordsRepository;
let createDowntimeRecord: CreateDowntimeRecordUseCase;
let sut: EndDowntimeRecordUseCase;

describe('EndDowntimeRecordUseCase', () => {
  beforeEach(() => {
    downtimeRecordsRepository = new InMemoryDowntimeRecordsRepository();
    createDowntimeRecord = new CreateDowntimeRecordUseCase(
      downtimeRecordsRepository,
    );
    sut = new EndDowntimeRecordUseCase(downtimeRecordsRepository);
  });

  it('should end a downtime record', async () => {
    const startTime = new Date('2026-01-15T08:00:00Z');
    const endTime = new Date('2026-01-15T10:00:00Z');

    const { downtimeRecord: created } = await createDowntimeRecord.execute({
      workstationId: 'ws-1',
      downtimeReasonId: 'reason-1',
      startTime,
      reportedById: 'user-1',
    });

    const { downtimeRecord } = await sut.execute({
      id: created.id.toString(),
      endTime,
    });

    expect(downtimeRecord.endTime).toEqual(endTime);
    expect(downtimeRecord.durationMinutes).toBe(120);
  });

  it('should use current time when no endTime provided', async () => {
    const { downtimeRecord: created } = await createDowntimeRecord.execute({
      workstationId: 'ws-1',
      downtimeReasonId: 'reason-1',
      startTime: new Date('2026-01-15T08:00:00Z'),
      reportedById: 'user-1',
    });

    const { downtimeRecord } = await sut.execute({
      id: created.id.toString(),
    });

    expect(downtimeRecord.endTime).toBeDefined();
    expect(downtimeRecord.durationMinutes).toBeGreaterThan(0);
  });

  it('should throw error if downtime record does not exist', async () => {
    await expect(() =>
      sut.execute({ id: 'non-existent-id' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw error if downtime record has already been ended', async () => {
    const startTime = new Date('2026-01-15T08:00:00Z');
    const endTime = new Date('2026-01-15T10:00:00Z');

    const { downtimeRecord: created } = await createDowntimeRecord.execute({
      workstationId: 'ws-1',
      downtimeReasonId: 'reason-1',
      startTime,
      endTime,
      reportedById: 'user-1',
    });

    await expect(() =>
      sut.execute({
        id: created.id.toString(),
        endTime: new Date('2026-01-15T11:00:00Z'),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
