import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryCustomersRepository } from '@/repositories/sales/in-memory/in-memory-customers-repository';
import { InMemoryLeadScoringRulesRepository } from '@/repositories/sales/in-memory/in-memory-lead-scoring-rules-repository';
import { InMemoryLeadScoresRepository } from '@/repositories/sales/in-memory/in-memory-lead-scores-repository';
import { CustomerType } from '@/entities/sales/value-objects/customer-type';
import { beforeEach, describe, expect, it } from 'vitest';
import { CalculateLeadScoreUseCase } from './calculate-lead-score';

let leadScoringRulesRepository: InMemoryLeadScoringRulesRepository;
let leadScoresRepository: InMemoryLeadScoresRepository;
let customersRepository: InMemoryCustomersRepository;
let calculateLeadScore: CalculateLeadScoreUseCase;

describe('CalculateLeadScoreUseCase', () => {
  beforeEach(() => {
    leadScoringRulesRepository = new InMemoryLeadScoringRulesRepository();
    leadScoresRepository = new InMemoryLeadScoresRepository();
    customersRepository = new InMemoryCustomersRepository();
    calculateLeadScore = new CalculateLeadScoreUseCase(
      leadScoringRulesRepository,
      leadScoresRepository,
      customersRepository,
    );
  });

  it('should calculate score for a customer with active rules', async () => {
    const customer = await customersRepository.create({
      tenantId: 'tenant-1',
      name: 'John Doe',
      type: CustomerType.create('INDIVIDUAL'),
    });

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
      points: 50,
    });

    const { leadScore } = await calculateLeadScore.execute({
      tenantId: 'tenant-1',
      customerId: customer.id.toString(),
    });

    expect(leadScore.score).toBe(80);
    expect(leadScore.tier).toBe('HOT');
    expect(leadScore.factors).toHaveLength(2);
  });

  it('should determine WARM tier for score between 50-79', async () => {
    const customer = await customersRepository.create({
      tenantId: 'tenant-1',
      name: 'Jane Doe',
      type: CustomerType.create('INDIVIDUAL'),
    });

    await leadScoringRulesRepository.create({
      tenantId: 'tenant-1',
      name: 'Website Visit',
      field: 'website_visit',
      condition: 'equals',
      value: 'true',
      points: 60,
    });

    const { leadScore } = await calculateLeadScore.execute({
      tenantId: 'tenant-1',
      customerId: customer.id.toString(),
    });

    expect(leadScore.score).toBe(60);
    expect(leadScore.tier).toBe('WARM');
  });

  it('should determine COLD tier for score below 50', async () => {
    const customer = await customersRepository.create({
      tenantId: 'tenant-1',
      name: 'Cold Lead',
      type: CustomerType.create('INDIVIDUAL'),
    });

    await leadScoringRulesRepository.create({
      tenantId: 'tenant-1',
      name: 'Newsletter Signup',
      field: 'newsletter_signup',
      condition: 'equals',
      value: 'true',
      points: 10,
    });

    const { leadScore } = await calculateLeadScore.execute({
      tenantId: 'tenant-1',
      customerId: customer.id.toString(),
    });

    expect(leadScore.score).toBe(10);
    expect(leadScore.tier).toBe('COLD');
  });

  it('should clamp score to 0-100 range', async () => {
    const customer = await customersRepository.create({
      tenantId: 'tenant-1',
      name: 'Negative Lead',
      type: CustomerType.create('INDIVIDUAL'),
    });

    await leadScoringRulesRepository.create({
      tenantId: 'tenant-1',
      name: 'Penalty',
      field: 'days_inactive',
      condition: 'greater_than',
      value: '30',
      points: -50,
    });

    const { leadScore } = await calculateLeadScore.execute({
      tenantId: 'tenant-1',
      customerId: customer.id.toString(),
    });

    expect(leadScore.score).toBe(0);
    expect(leadScore.tier).toBe('COLD');
  });

  it('should throw when customer not found', async () => {
    await expect(() =>
      calculateLeadScore.execute({
        tenantId: 'tenant-1',
        customerId: 'non-existent-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should upsert (update existing score)', async () => {
    const customer = await customersRepository.create({
      tenantId: 'tenant-1',
      name: 'Recurring',
      type: CustomerType.create('INDIVIDUAL'),
    });

    await leadScoringRulesRepository.create({
      tenantId: 'tenant-1',
      name: 'Rule A',
      field: 'email_opened',
      condition: 'equals',
      value: 'true',
      points: 30,
    });

    await calculateLeadScore.execute({
      tenantId: 'tenant-1',
      customerId: customer.id.toString(),
    });

    // Add another rule and recalculate
    await leadScoringRulesRepository.create({
      tenantId: 'tenant-1',
      name: 'Rule B',
      field: 'meeting_scheduled',
      condition: 'equals',
      value: 'true',
      points: 40,
    });

    const { leadScore } = await calculateLeadScore.execute({
      tenantId: 'tenant-1',
      customerId: customer.id.toString(),
    });

    expect(leadScore.score).toBe(70);
    expect(leadScore.tier).toBe('WARM');
    // Should still be one record
    expect(leadScoresRepository.items).toHaveLength(1);
  });
});
