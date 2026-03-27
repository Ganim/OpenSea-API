import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { DealPrediction } from '@/entities/sales/deal-prediction';
import { InMemoryDealPredictionsRepository } from '@/repositories/sales/in-memory/in-memory-deal-predictions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetDealPredictionUseCase } from './get-deal-prediction';

let dealPredictionsRepository: InMemoryDealPredictionsRepository;
let getDealPrediction: GetDealPredictionUseCase;

const TENANT_ID = 'tenant-1';
const DEAL_ID = 'deal-1';

describe('GetDealPredictionUseCase', () => {
  beforeEach(() => {
    dealPredictionsRepository = new InMemoryDealPredictionsRepository();
    getDealPrediction = new GetDealPredictionUseCase(dealPredictionsRepository);
  });

  it('should return the latest prediction for a deal', async () => {
    const prediction = DealPrediction.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      dealId: new UniqueEntityID(DEAL_ID),
      probability: 0.75,
      factors: [
        {
          factor: 'stage_progression',
          impact: 0.2,
          description: 'Good progress',
        },
      ],
    });
    await dealPredictionsRepository.create(prediction);

    const result = await getDealPrediction.execute({
      tenantId: TENANT_ID,
      dealId: DEAL_ID,
    });

    expect(result.prediction).toBeDefined();
    expect(result.prediction!.probability).toBe(0.75);
    expect(result.prediction!.confidence).toBe('HIGH');
  });

  it('should return null when no prediction exists', async () => {
    const result = await getDealPrediction.execute({
      tenantId: TENANT_ID,
      dealId: 'nonexistent-deal',
    });

    expect(result.prediction).toBeNull();
  });
});
