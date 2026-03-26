import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryLeadScoringRulesRepository } from '@/repositories/sales/in-memory/in-memory-lead-scoring-rules-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateScoringRuleUseCase } from './create-scoring-rule';

let leadScoringRulesRepository: InMemoryLeadScoringRulesRepository;
let createScoringRule: CreateScoringRuleUseCase;

describe('CreateScoringRuleUseCase', () => {
  beforeEach(() => {
    leadScoringRulesRepository = new InMemoryLeadScoringRulesRepository();
    createScoringRule = new CreateScoringRuleUseCase(
      leadScoringRulesRepository,
    );
  });

  it('should create a scoring rule with positive points', async () => {
    const { scoringRule } = await createScoringRule.execute({
      tenantId: 'tenant-1',
      name: 'Email Opened',
      field: 'email_opened',
      condition: 'equals',
      value: 'true',
      points: 10,
    });

    expect(scoringRule).toBeDefined();
    expect(scoringRule.name).toBe('Email Opened');
    expect(scoringRule.field).toBe('email_opened');
    expect(scoringRule.condition).toBe('equals');
    expect(scoringRule.value).toBe('true');
    expect(scoringRule.points).toBe(10);
    expect(scoringRule.isActive).toBe(true);
  });

  it('should create a scoring rule with negative points (penalty)', async () => {
    const { scoringRule } = await createScoringRule.execute({
      tenantId: 'tenant-1',
      name: 'Days Inactive Penalty',
      field: 'days_inactive',
      condition: 'greater_than',
      value: '30',
      points: -15,
    });

    expect(scoringRule.points).toBe(-15);
  });

  it('should not allow empty name', async () => {
    await expect(() =>
      createScoringRule.execute({
        tenantId: 'tenant-1',
        name: '',
        field: 'email_opened',
        condition: 'equals',
        value: 'true',
        points: 10,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow zero points', async () => {
    await expect(() =>
      createScoringRule.execute({
        tenantId: 'tenant-1',
        name: 'Zero Rule',
        field: 'email_opened',
        condition: 'equals',
        value: 'true',
        points: 0,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow empty field', async () => {
    await expect(() =>
      createScoringRule.execute({
        tenantId: 'tenant-1',
        name: 'Rule',
        field: '',
        condition: 'equals',
        value: 'true',
        points: 10,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow empty condition', async () => {
    await expect(() =>
      createScoringRule.execute({
        tenantId: 'tenant-1',
        name: 'Rule',
        field: 'email_opened',
        condition: '',
        value: 'true',
        points: 10,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should trim name', async () => {
    const { scoringRule } = await createScoringRule.execute({
      tenantId: 'tenant-1',
      name: '  Trimmed Rule  ',
      field: 'email_opened',
      condition: 'equals',
      value: 'true',
      points: 5,
    });

    expect(scoringRule.name).toBe('Trimmed Rule');
  });
});
