import { InMemoryAnalyticsGoalsRepository } from '@/repositories/sales/in-memory/in-memory-analytics-goals-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteGoalUseCase } from './delete-goal';

let goalsRepository: InMemoryAnalyticsGoalsRepository;
let sut: DeleteGoalUseCase;

describe('DeleteGoalUseCase', () => {
  beforeEach(() => {
    goalsRepository = new InMemoryAnalyticsGoalsRepository();
    sut = new DeleteGoalUseCase(goalsRepository);
  });

  it('should delete an existing goal', async () => {
    const goal = await goalsRepository.create({
      tenantId: 'tenant-1',
      name: 'Revenue Goal',
      type: 'REVENUE',
      targetValue: 100000,
      period: 'MONTHLY',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
      scope: 'INDIVIDUAL',
      createdByUserId: 'user-1',
    });

    await sut.execute({
      id: goal.id.toString(),
      tenantId: 'tenant-1',
    });

    expect(goal.deletedAt).toBeTruthy();
  });

  it('should throw if goal is not found', async () => {
    await expect(
      sut.execute({
        id: 'non-existent',
        tenantId: 'tenant-1',
      }),
    ).rejects.toThrow();
  });

  it('should throw if goal belongs to another tenant', async () => {
    const goal = await goalsRepository.create({
      tenantId: 'tenant-1',
      name: 'Revenue Goal',
      type: 'REVENUE',
      targetValue: 100000,
      period: 'MONTHLY',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
      scope: 'INDIVIDUAL',
      createdByUserId: 'user-1',
    });

    await expect(
      sut.execute({
        id: goal.id.toString(),
        tenantId: 'tenant-2',
      }),
    ).rejects.toThrow();
  });
});
