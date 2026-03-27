import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Deal } from '@/entities/sales/deal';
import { PipelineStage } from '@/entities/sales/pipeline-stage';
import { InMemoryDealPredictionsRepository } from '@/repositories/sales/in-memory/in-memory-deal-predictions-repository';
import { InMemoryDealsRepository } from '@/repositories/sales/in-memory/in-memory-deals-repository';
import { InMemoryPipelineStagesRepository } from '@/repositories/sales/in-memory/in-memory-pipeline-stages-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { PredictDealClosureUseCase } from './predict-deal-closure';

let dealsRepository: InMemoryDealsRepository;
let dealPredictionsRepository: InMemoryDealPredictionsRepository;
let pipelineStagesRepository: InMemoryPipelineStagesRepository;
let predictDealClosure: PredictDealClosureUseCase;

const TENANT_ID = 'tenant-1';
const PIPELINE_ID = 'pipeline-1';

function createStages(count: number): PipelineStage[] {
  const stages: PipelineStage[] = [];
  for (let i = 0; i < count; i++) {
    stages.push(
      PipelineStage.create({
        pipelineId: new UniqueEntityID(PIPELINE_ID),
        name: `Stage ${i + 1}`,
        position: i,
        type: 'NORMAL',
        color: '#6366f1',
      }),
    );
  }
  return stages;
}

describe('PredictDealClosureUseCase', () => {
  beforeEach(() => {
    dealsRepository = new InMemoryDealsRepository();
    dealPredictionsRepository = new InMemoryDealPredictionsRepository();
    pipelineStagesRepository = new InMemoryPipelineStagesRepository();

    predictDealClosure = new PredictDealClosureUseCase(
      dealsRepository,
      dealPredictionsRepository,
      pipelineStagesRepository,
    );
  });

  it('should predict deal closure for an open deal', async () => {
    const stages = createStages(4);
    for (const stage of stages) {
      pipelineStagesRepository.items.push(stage);
    }

    const deal = Deal.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      title: 'Test Deal',
      customerId: new UniqueEntityID('customer-1'),
      pipelineId: new UniqueEntityID(PIPELINE_ID),
      stageId: stages[1].id,
      value: 3000,
    });
    await dealsRepository.create(deal);

    const result = await predictDealClosure.execute({
      tenantId: TENANT_ID,
      dealId: deal.id.toString(),
    });

    expect(result.prediction).toBeDefined();
    expect(result.prediction.probability).toBeGreaterThan(0);
    expect(result.prediction.probability).toBeLessThanOrEqual(1);
    expect(result.prediction.confidence).toBeDefined();
    expect(result.prediction.factors.length).toBeGreaterThan(0);
    expect(result.prediction.modelVersion).toBe('v1');
  });

  it('should return probability 1.0 for won deals', async () => {
    const stages = createStages(3);
    for (const stage of stages) {
      pipelineStagesRepository.items.push(stage);
    }

    const deal = Deal.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      title: 'Won Deal',
      customerId: new UniqueEntityID('customer-1'),
      pipelineId: new UniqueEntityID(PIPELINE_ID),
      stageId: stages[2].id,
    });
    deal.markAsWon();
    await dealsRepository.create(deal);

    const result = await predictDealClosure.execute({
      tenantId: TENANT_ID,
      dealId: deal.id.toString(),
    });

    expect(result.prediction.probability).toBe(1);
  });

  it('should return probability 0.0 for lost deals', async () => {
    const stages = createStages(3);
    for (const stage of stages) {
      pipelineStagesRepository.items.push(stage);
    }

    const deal = Deal.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      title: 'Lost Deal',
      customerId: new UniqueEntityID('customer-1'),
      pipelineId: new UniqueEntityID(PIPELINE_ID),
      stageId: stages[0].id,
    });
    deal.markAsLost('Budget constraints');
    await dealsRepository.create(deal);

    const result = await predictDealClosure.execute({
      tenantId: TENANT_ID,
      dealId: deal.id.toString(),
    });

    expect(result.prediction.probability).toBe(0);
  });

  it('should throw when deal is not found', async () => {
    await expect(() =>
      predictDealClosure.execute({
        tenantId: TENANT_ID,
        dealId: 'nonexistent-deal',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should store prediction in repository', async () => {
    const stages = createStages(3);
    for (const stage of stages) {
      pipelineStagesRepository.items.push(stage);
    }

    const deal = Deal.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      title: 'Test Deal',
      customerId: new UniqueEntityID('customer-1'),
      pipelineId: new UniqueEntityID(PIPELINE_ID),
      stageId: stages[0].id,
    });
    await dealsRepository.create(deal);

    await predictDealClosure.execute({
      tenantId: TENANT_ID,
      dealId: deal.id.toString(),
    });

    expect(dealPredictionsRepository.items).toHaveLength(1);
  });
});
