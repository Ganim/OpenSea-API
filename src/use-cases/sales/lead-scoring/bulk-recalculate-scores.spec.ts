import { InMemoryCustomersRepository } from '@/repositories/sales/in-memory/in-memory-customers-repository';
import { InMemoryLeadScoringRulesRepository } from '@/repositories/sales/in-memory/in-memory-lead-scoring-rules-repository';
import { InMemoryLeadScoresRepository } from '@/repositories/sales/in-memory/in-memory-lead-scores-repository';
import { CustomerType } from '@/entities/sales/value-objects/customer-type';
import { beforeEach, describe, expect, it } from 'vitest';
import { BulkRecalculateScoresUseCase } from './bulk-recalculate-scores';

let leadScoringRulesRepository: InMemoryLeadScoringRulesRepository;
let leadScoresRepository: InMemoryLeadScoresRepository;
let customersRepository: InMemoryCustomersRepository;
let bulkRecalculate: BulkRecalculateScoresUseCase;

describe('BulkRecalculateScoresUseCase', () => {
  beforeEach(() => {
    leadScoringRulesRepository = new InMemoryLeadScoringRulesRepository();
    leadScoresRepository = new InMemoryLeadScoresRepository();
    customersRepository = new InMemoryCustomersRepository();
    bulkRecalculate = new BulkRecalculateScoresUseCase(
      leadScoringRulesRepository,
      leadScoresRepository,
      customersRepository,
    );
  });

  it('should recalculate scores for all active customers', async () => {
    for (let i = 1; i <= 3; i++) {
      await customersRepository.create({
        tenantId: 'tenant-1',
        name: `Customer ${i}`,
        type: CustomerType.create('INDIVIDUAL'),
      });
    }

    await leadScoringRulesRepository.create({
      tenantId: 'tenant-1',
      name: 'Email Opened',
      field: 'email_opened',
      condition: 'equals',
      value: 'true',
      points: 30,
    });

    await leadScoringRulesRepository.create({
      tenantId: 'tenant-1',
      name: 'Meeting Scheduled',
      field: 'meeting_scheduled',
      condition: 'equals',
      value: 'true',
      points: 25,
    });

    const { processedCount } = await bulkRecalculate.execute({
      tenantId: 'tenant-1',
    });

    expect(processedCount).toBe(3);
    expect(leadScoresRepository.items).toHaveLength(3);

    for (const scoreRecord of leadScoresRepository.items) {
      expect(scoreRecord.score).toBe(55);
      expect(scoreRecord.tier).toBe('WARM');
    }
  });

  it('should return zero when no customers exist', async () => {
    const { processedCount } = await bulkRecalculate.execute({
      tenantId: 'tenant-1',
    });

    expect(processedCount).toBe(0);
  });

  it('should only process customers from the specified tenant', async () => {
    await customersRepository.create({
      tenantId: 'tenant-1',
      name: 'Tenant 1 Customer',
      type: CustomerType.create('INDIVIDUAL'),
    });

    await customersRepository.create({
      tenantId: 'tenant-2',
      name: 'Tenant 2 Customer',
      type: CustomerType.create('INDIVIDUAL'),
    });

    await leadScoringRulesRepository.create({
      tenantId: 'tenant-1',
      name: 'Rule',
      field: 'email_opened',
      condition: 'equals',
      value: 'true',
      points: 40,
    });

    const { processedCount } = await bulkRecalculate.execute({
      tenantId: 'tenant-1',
    });

    expect(processedCount).toBe(1);
  });
});
