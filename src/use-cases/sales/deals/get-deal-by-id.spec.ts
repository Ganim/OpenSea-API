import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Deal } from '@/entities/sales/deal';
import { InMemoryDealsRepository } from '@/repositories/sales/in-memory/in-memory-deals-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetDealByIdUseCase } from './get-deal-by-id';

let dealsRepository: InMemoryDealsRepository;
let sut: GetDealByIdUseCase;

describe('Get Deal By Id Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    dealsRepository = new InMemoryDealsRepository();
    sut = new GetDealByIdUseCase(dealsRepository);
  });

  it('should get a deal by id', async () => {
    const deal = Deal.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      title: 'Big Deal',
      customerId: new UniqueEntityID('cust-1'),
      pipelineId: new UniqueEntityID('pipeline-1'),
      stageId: new UniqueEntityID('stage-1'),
      priority: 'HIGH',
      currency: 'BRL',
      tags: [],
    });
    dealsRepository.items.push(deal);

    const result = await sut.execute({
      id: deal.id.toString(),
      tenantId: TENANT_ID,
    });

    expect(result.deal.title).toBe('Big Deal');
    expect(result.deal.priority).toBe('HIGH');
  });

  it('should throw if deal not found', async () => {
    await expect(() =>
      sut.execute({ id: 'non-existent', tenantId: TENANT_ID }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
