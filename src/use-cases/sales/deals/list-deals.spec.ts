import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Deal } from '@/entities/sales/deal';
import { InMemoryDealsRepository } from '@/repositories/sales/in-memory/in-memory-deals-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListDealsUseCase } from './list-deals';

let dealsRepository: InMemoryDealsRepository;
let sut: ListDealsUseCase;

describe('List Deals Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    dealsRepository = new InMemoryDealsRepository();
    sut = new ListDealsUseCase(dealsRepository);
  });

  it('should list deals with pagination', async () => {
    for (let i = 0; i < 5; i++) {
      dealsRepository.items.push(
        Deal.create({
          tenantId: new UniqueEntityID(TENANT_ID),
          title: `Deal ${i}`,
          customerId: new UniqueEntityID('cust-1'),
          pipelineId: new UniqueEntityID('pipeline-1'),
          stageId: new UniqueEntityID('stage-1'),
          priority: 'MEDIUM',
          currency: 'BRL',
          tags: [],
        }),
      );
    }

    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 3,
    });

    expect(result.deals).toHaveLength(3);
    expect(result.total).toBe(5);
    expect(result.totalPages).toBe(2);
  });

  it('should return empty list when no deals', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 10,
    });

    expect(result.deals).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
