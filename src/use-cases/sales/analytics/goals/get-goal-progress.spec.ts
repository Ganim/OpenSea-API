import { InMemoryAnalyticsGoalsRepository } from '@/repositories/sales/in-memory/in-memory-analytics-goals-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetGoalProgressUseCase } from './get-goal-progress';

let goalsRepository: InMemoryAnalyticsGoalsRepository;
let sut: GetGoalProgressUseCase;

describe('GetGoalProgressUseCase', () => {
  beforeEach(() => {
    goalsRepository = new InMemoryAnalyticsGoalsRepository();
    sut = new GetGoalProgressUseCase(goalsRepository);
  });

  it('should return goal progress details', async () => {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 15);
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + 15);

    const goal = await goalsRepository.create({
      tenantId: 'tenant-1',
      name: 'Monthly Revenue',
      type: 'REVENUE',
      targetValue: 100000,
      currentValue: 60000,
      period: 'MONTHLY',
      startDate,
      endDate,
      scope: 'TEAM',
      createdByUserId: 'user-1',
    });

    const result = await sut.execute({
      id: goal.id.toString(),
      tenantId: 'tenant-1',
    });

    expect(result.goal).toBeTruthy();
    expect(result.goal.name).toBe('Monthly Revenue');
    expect(result.totalDays).toBeGreaterThan(0);
    expect(result.daysElapsed).toBeGreaterThanOrEqual(0);
    expect(result.daysRemaining).toBeGreaterThanOrEqual(0);
    expect(typeof result.onTrack).toBe('boolean');
  });

  it('should throw if goal is not found', async () => {
    await expect(
      sut.execute({
        id: 'non-existent',
        tenantId: 'tenant-1',
      }),
    ).rejects.toThrow();
  });

  it('should mark goal as on track when progress exceeds time elapsed', async () => {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 10);
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + 20);

    const goal = await goalsRepository.create({
      tenantId: 'tenant-1',
      name: 'Sales Goal',
      type: 'DEALS',
      targetValue: 100,
      currentValue: 90,
      period: 'MONTHLY',
      startDate,
      endDate,
      scope: 'INDIVIDUAL',
      createdByUserId: 'user-1',
    });

    const result = await sut.execute({
      id: goal.id.toString(),
      tenantId: 'tenant-1',
    });

    expect(result.onTrack).toBe(true);
  });
});
