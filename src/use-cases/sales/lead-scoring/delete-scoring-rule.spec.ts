import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryLeadScoringRulesRepository } from '@/repositories/sales/in-memory/in-memory-lead-scoring-rules-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteScoringRuleUseCase } from './delete-scoring-rule';

let leadScoringRulesRepository: InMemoryLeadScoringRulesRepository;
let deleteScoringRule: DeleteScoringRuleUseCase;

describe('DeleteScoringRuleUseCase', () => {
  beforeEach(() => {
    leadScoringRulesRepository = new InMemoryLeadScoringRulesRepository();
    deleteScoringRule = new DeleteScoringRuleUseCase(
      leadScoringRulesRepository,
    );
  });

  it('should soft-delete a scoring rule', async () => {
    const created = await leadScoringRulesRepository.create({
      tenantId: 'tenant-1',
      name: 'To Delete',
      field: 'email_opened',
      condition: 'equals',
      value: 'true',
      points: 10,
    });

    const { message } = await deleteScoringRule.execute({
      tenantId: 'tenant-1',
      id: created.id.toString(),
    });

    expect(message).toBe('Scoring rule deleted successfully.');

    const found = await leadScoringRulesRepository.findById(
      created.id,
      'tenant-1',
    );
    expect(found).toBeNull();
  });

  it('should throw when rule not found', async () => {
    await expect(() =>
      deleteScoringRule.execute({
        tenantId: 'tenant-1',
        id: 'non-existent-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
