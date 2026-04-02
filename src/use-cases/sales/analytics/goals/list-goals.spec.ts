import { InMemoryAnalyticsGoalsRepository } from '@/repositories/sales/in-memory/in-memory-analytics-goals-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListGoalsUseCase } from './list-goals';

let goalsRepository: InMemoryAnalyticsGoalsRepository;
let sut: ListGoalsUseCase;

describe('ListGoalsUseCase', () => {
  beforeEach(() => {
    goalsRepository = new InMemoryAnalyticsGoalsRepository();
    sut = new ListGoalsUseCase(goalsRepository);
  });

  it('should list goals with pagination', async () => {
    for (let i = 0; i < 5; i++) {
      await goalsRepository.create({
        tenantId: 'tenant-1',
        name: `Goal ${i}`,
        type: 'REVENUE',
        targetValue: 10000,
        period: 'MONTHLY',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-31'),
        scope: 'TEAM',
        createdByUserId: 'user-1',
      });
    }

    const result = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      perPage: 3,
    });

    expect(result.goals).toHaveLength(3);
    expect(result.total).toBe(5);
    expect(result.totalPages).toBe(2);
  });

  it('should return empty list when no goals exist', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.goals).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should use default pagination', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.page).toBe(1);
    expect(result.perPage).toBe(20);
  });

  it('should filter by status', async () => {
    await goalsRepository.create({
      tenantId: 'tenant-1',
      name: 'Active Goal',
      type: 'REVENUE',
      targetValue: 10000,
      status: 'ACTIVE',
      period: 'MONTHLY',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
      scope: 'TEAM',
      createdByUserId: 'user-1',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      status: 'ACTIVE',
    });

    expect(result.goals).toHaveLength(1);
  });
});
