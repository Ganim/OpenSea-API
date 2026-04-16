import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryOneOnOneMeetingsRepository } from '@/repositories/hr/in-memory/in-memory-one-on-one-meetings-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListOneOnOnesUseCase } from './list-one-on-ones';

let oneOnOneMeetingsRepository: InMemoryOneOnOneMeetingsRepository;
let sut: ListOneOnOnesUseCase;
const tenantId = new UniqueEntityID().toString();
const managerId = new UniqueEntityID();
const reportId = new UniqueEntityID();
const otherEmployeeId = new UniqueEntityID();

describe('List One-on-Ones Use Case', () => {
  beforeEach(() => {
    oneOnOneMeetingsRepository = new InMemoryOneOnOneMeetingsRepository();
    sut = new ListOneOnOnesUseCase(oneOnOneMeetingsRepository);
  });

  it('should list meetings where viewer participates', async () => {
    await oneOnOneMeetingsRepository.create({
      tenantId,
      managerId,
      reportId,
      scheduledAt: new Date('2025-08-01'),
      durationMinutes: 30,
    });

    await oneOnOneMeetingsRepository.create({
      tenantId,
      managerId: otherEmployeeId,
      reportId: new UniqueEntityID(),
      scheduledAt: new Date('2025-08-05'),
      durationMinutes: 30,
    });

    const result = await sut.execute({
      tenantId,
      participantEmployeeId: reportId.toString(),
    });

    expect(result.meetings).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it('should filter by status', async () => {
    const scheduled = await oneOnOneMeetingsRepository.create({
      tenantId,
      managerId,
      reportId,
      scheduledAt: new Date('2025-08-01'),
      durationMinutes: 30,
    });

    const completed = await oneOnOneMeetingsRepository.create({
      tenantId,
      managerId,
      reportId,
      scheduledAt: new Date('2025-08-10'),
      durationMinutes: 30,
    });
    completed.markCompleted();
    await oneOnOneMeetingsRepository.save(completed);

    const result = await sut.execute({
      tenantId,
      participantEmployeeId: managerId.toString(),
      status: 'COMPLETED',
    });

    expect(result.meetings).toHaveLength(1);
    expect(result.meetings[0].id.equals(completed.id)).toBe(true);
    expect(scheduled.status).toBe('SCHEDULED');
  });

  it('should filter by manager role only', async () => {
    await oneOnOneMeetingsRepository.create({
      tenantId,
      managerId,
      reportId,
      scheduledAt: new Date('2025-08-01'),
      durationMinutes: 30,
    });

    await oneOnOneMeetingsRepository.create({
      tenantId,
      managerId: otherEmployeeId,
      reportId: managerId,
      scheduledAt: new Date('2025-08-02'),
      durationMinutes: 30,
    });

    const result = await sut.execute({
      tenantId,
      participantEmployeeId: managerId.toString(),
      role: 'MANAGER',
    });

    expect(result.meetings).toHaveLength(1);
    expect(result.meetings[0].managerId.equals(managerId)).toBe(true);
  });

  it('should filter by date range', async () => {
    await oneOnOneMeetingsRepository.create({
      tenantId,
      managerId,
      reportId,
      scheduledAt: new Date('2025-01-01'),
      durationMinutes: 30,
    });

    await oneOnOneMeetingsRepository.create({
      tenantId,
      managerId,
      reportId,
      scheduledAt: new Date('2025-06-01'),
      durationMinutes: 30,
    });

    const result = await sut.execute({
      tenantId,
      participantEmployeeId: managerId.toString(),
      from: new Date('2025-05-01'),
      to: new Date('2025-12-31'),
    });

    expect(result.meetings).toHaveLength(1);
    expect(result.meetings[0].scheduledAt.getUTCMonth()).toBe(5); // June (0-indexed)
  });
});
