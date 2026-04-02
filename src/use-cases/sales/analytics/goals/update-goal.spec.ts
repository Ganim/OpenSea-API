import { InMemoryAnalyticsGoalsRepository } from '@/repositories/sales/in-memory/in-memory-analytics-goals-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateGoalUseCase } from './update-goal';

let goalsRepository: InMemoryAnalyticsGoalsRepository;
let sut: UpdateGoalUseCase;

describe('UpdateGoalUseCase', () => {
  beforeEach(() => {
    goalsRepository = new InMemoryAnalyticsGoalsRepository();
    sut = new UpdateGoalUseCase(goalsRepository);
  });

  it('should update goal fields', async () => {
    const goal = await goalsRepository.create({
      tenantId: 'tenant-1',
      name: 'Old Goal',
      type: 'REVENUE',
      targetValue: 50000,
      period: 'MONTHLY',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
      scope: 'TEAM',
      createdByUserId: 'user-1',
    });

    const result = await sut.execute({
      id: goal.id.toString(),
      tenantId: 'tenant-1',
      name: 'Updated Goal',
      targetValue: 80000,
    });

    expect(result.goal.name).toBe('Updated Goal');
    expect(result.goal.targetValue).toBe(80000);
  });

  it('should throw if goal is not found', async () => {
    await expect(
      sut.execute({
        id: 'non-existent',
        tenantId: 'tenant-1',
        name: 'Test',
      }),
    ).rejects.toThrow();
  });

  it('should throw if name is empty string', async () => {
    const goal = await goalsRepository.create({
      tenantId: 'tenant-1',
      name: 'Existing Goal',
      type: 'REVENUE',
      targetValue: 50000,
      period: 'MONTHLY',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
      scope: 'TEAM',
      createdByUserId: 'user-1',
    });

    await expect(
      sut.execute({
        id: goal.id.toString(),
        tenantId: 'tenant-1',
        name: '  ',
      }),
    ).rejects.toThrow('Goal name cannot be empty.');
  });

  it('should throw if targetValue is zero or negative', async () => {
    const goal = await goalsRepository.create({
      tenantId: 'tenant-1',
      name: 'Existing Goal',
      type: 'REVENUE',
      targetValue: 50000,
      period: 'MONTHLY',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
      scope: 'TEAM',
      createdByUserId: 'user-1',
    });

    await expect(
      sut.execute({
        id: goal.id.toString(),
        tenantId: 'tenant-1',
        targetValue: 0,
      }),
    ).rejects.toThrow('Target value must be greater than zero.');
  });

  it('should update currentValue', async () => {
    const goal = await goalsRepository.create({
      tenantId: 'tenant-1',
      name: 'Goal',
      type: 'REVENUE',
      targetValue: 50000,
      period: 'MONTHLY',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
      scope: 'TEAM',
      createdByUserId: 'user-1',
    });

    const result = await sut.execute({
      id: goal.id.toString(),
      tenantId: 'tenant-1',
      currentValue: 30000,
    });

    expect(result.goal.currentValue).toBe(30000);
  });
});
