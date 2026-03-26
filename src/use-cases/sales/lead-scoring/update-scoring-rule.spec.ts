import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryLeadScoringRulesRepository } from '@/repositories/sales/in-memory/in-memory-lead-scoring-rules-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateScoringRuleUseCase } from './update-scoring-rule';

let leadScoringRulesRepository: InMemoryLeadScoringRulesRepository;
let updateScoringRule: UpdateScoringRuleUseCase;

describe('UpdateScoringRuleUseCase', () => {
  beforeEach(() => {
    leadScoringRulesRepository = new InMemoryLeadScoringRulesRepository();
    updateScoringRule = new UpdateScoringRuleUseCase(
      leadScoringRulesRepository,
    );
  });

  it('should update a scoring rule name', async () => {
    const created = await leadScoringRulesRepository.create({
      tenantId: 'tenant-1',
      name: 'Original Name',
      field: 'email_opened',
      condition: 'equals',
      value: 'true',
      points: 10,
    });

    const { scoringRule } = await updateScoringRule.execute({
      tenantId: 'tenant-1',
      id: created.id.toString(),
      name: 'Updated Name',
    });

    expect(scoringRule.name).toBe('Updated Name');
  });

  it('should update points', async () => {
    const created = await leadScoringRulesRepository.create({
      tenantId: 'tenant-1',
      name: 'Rule',
      field: 'meeting_scheduled',
      condition: 'equals',
      value: 'true',
      points: 10,
    });

    const { scoringRule } = await updateScoringRule.execute({
      tenantId: 'tenant-1',
      id: created.id.toString(),
      points: 20,
    });

    expect(scoringRule.points).toBe(20);
  });

  it('should not allow zero points update', async () => {
    const created = await leadScoringRulesRepository.create({
      tenantId: 'tenant-1',
      name: 'Rule',
      field: 'email_opened',
      condition: 'equals',
      value: 'true',
      points: 10,
    });

    await expect(() =>
      updateScoringRule.execute({
        tenantId: 'tenant-1',
        id: created.id.toString(),
        points: 0,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when rule not found', async () => {
    await expect(() =>
      updateScoringRule.execute({
        tenantId: 'tenant-1',
        id: 'non-existent-id',
        name: 'New Name',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should deactivate a rule', async () => {
    const created = await leadScoringRulesRepository.create({
      tenantId: 'tenant-1',
      name: 'Rule',
      field: 'email_opened',
      condition: 'equals',
      value: 'true',
      points: 5,
    });

    const { scoringRule } = await updateScoringRule.execute({
      tenantId: 'tenant-1',
      id: created.id.toString(),
      isActive: false,
    });

    expect(scoringRule.isActive).toBe(false);
  });
});
