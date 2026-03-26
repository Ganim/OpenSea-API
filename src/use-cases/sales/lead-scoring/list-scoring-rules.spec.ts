import { InMemoryLeadScoringRulesRepository } from '@/repositories/sales/in-memory/in-memory-lead-scoring-rules-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListScoringRulesUseCase } from './list-scoring-rules';

let leadScoringRulesRepository: InMemoryLeadScoringRulesRepository;
let listScoringRules: ListScoringRulesUseCase;

describe('ListScoringRulesUseCase', () => {
  beforeEach(() => {
    leadScoringRulesRepository = new InMemoryLeadScoringRulesRepository();
    listScoringRules = new ListScoringRulesUseCase(leadScoringRulesRepository);
  });

  it('should list scoring rules with pagination', async () => {
    for (let i = 1; i <= 5; i++) {
      await leadScoringRulesRepository.create({
        tenantId: 'tenant-1',
        name: `Rule ${i}`,
        field: 'email_opened',
        condition: 'equals',
        value: 'true',
        points: i * 5,
      });
    }

    const firstPage = await listScoringRules.execute({
      tenantId: 'tenant-1',
      page: 1,
      perPage: 3,
    });

    expect(firstPage.scoringRules).toHaveLength(3);
    expect(firstPage.total).toBe(5);
    expect(firstPage.totalPages).toBe(2);

    const secondPage = await listScoringRules.execute({
      tenantId: 'tenant-1',
      page: 2,
      perPage: 3,
    });

    expect(secondPage.scoringRules).toHaveLength(2);
  });

  it('should return empty list when no rules exist', async () => {
    const response = await listScoringRules.execute({
      tenantId: 'tenant-1',
    });

    expect(response.scoringRules).toHaveLength(0);
    expect(response.total).toBe(0);
  });

  it('should only list rules for the specified tenant', async () => {
    await leadScoringRulesRepository.create({
      tenantId: 'tenant-1',
      name: 'Tenant 1 Rule',
      field: 'email_opened',
      condition: 'equals',
      value: 'true',
      points: 10,
    });

    await leadScoringRulesRepository.create({
      tenantId: 'tenant-2',
      name: 'Tenant 2 Rule',
      field: 'meeting_scheduled',
      condition: 'equals',
      value: 'true',
      points: 20,
    });

    const response = await listScoringRules.execute({
      tenantId: 'tenant-1',
    });

    expect(response.scoringRules).toHaveLength(1);
    expect(response.scoringRules[0].name).toBe('Tenant 1 Rule');
  });
});
