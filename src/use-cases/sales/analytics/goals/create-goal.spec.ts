import { describe, it, expect, beforeEach } from 'vitest';
import { CreateGoalUseCase } from './create-goal';
import { InMemoryAnalyticsGoalsRepository } from '@/repositories/sales/in-memory/in-memory-analytics-goals-repository';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';

let goalsRepository: InMemoryAnalyticsGoalsRepository;
let sut: CreateGoalUseCase;

describe('CreateGoalUseCase', () => {
  beforeEach(() => {
    goalsRepository = new InMemoryAnalyticsGoalsRepository();
    sut = new CreateGoalUseCase(goalsRepository);
  });

  it('should create a goal successfully', async () => {
    const { goal } = await sut.execute({
      tenantId: 'tenant-1',
      name: 'Meta Vendas Q1',
      type: 'REVENUE',
      targetValue: 100000,
      unit: 'BRL',
      period: 'QUARTERLY',
      startDate: '2026-01-01',
      endDate: '2026-03-31',
      scope: 'TENANT',
      createdByUserId: 'user-1',
    });

    expect(goal.id).toBeDefined();
    expect(goal.name).toBe('Meta Vendas Q1');
    expect(goal.type).toBe('REVENUE');
    expect(goal.targetValue).toBe(100000);
    expect(goal.currentValue).toBe(0);
    expect(goal.status).toBe('ACTIVE');
    expect(goal.progressPercentage).toBe(0);
  });

  it('should require name', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        name: '',
        type: 'REVENUE',
        targetValue: 100000,
        period: 'MONTHLY',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        scope: 'TENANT',
        createdByUserId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should reject invalid type', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        name: 'Test',
        type: 'INVALID',
        targetValue: 100000,
        period: 'MONTHLY',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        scope: 'TENANT',
        createdByUserId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should reject negative target value', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        name: 'Test',
        type: 'REVENUE',
        targetValue: -100,
        period: 'MONTHLY',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        scope: 'TENANT',
        createdByUserId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should require userId for individual scope', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        name: 'Test',
        type: 'REVENUE',
        targetValue: 100000,
        period: 'MONTHLY',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        scope: 'INDIVIDUAL',
        createdByUserId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should require teamId for team scope', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        name: 'Test',
        type: 'REVENUE',
        targetValue: 100000,
        period: 'MONTHLY',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        scope: 'TEAM',
        createdByUserId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should reject end date before start date', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        name: 'Test',
        type: 'REVENUE',
        targetValue: 100000,
        period: 'MONTHLY',
        startDate: '2026-03-31',
        endDate: '2026-01-01',
        scope: 'TENANT',
        createdByUserId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
