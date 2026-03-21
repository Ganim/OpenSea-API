import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Deal } from '@/entities/sales/deal';
import { InMemoryDealsRepository } from '@/repositories/sales/in-memory/in-memory-deals-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteDealUseCase } from './delete-deal';

let dealsRepository: InMemoryDealsRepository;
let sut: DeleteDealUseCase;

describe('Delete Deal Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    dealsRepository = new InMemoryDealsRepository();
    sut = new DeleteDealUseCase(dealsRepository);
  });

  it('should delete a deal', async () => {
    const deal = Deal.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      title: 'Deal to delete',
      customerId: new UniqueEntityID('cust-1'),
      pipelineId: new UniqueEntityID('pipeline-1'),
      stageId: new UniqueEntityID('stage-1'),
      priority: 'MEDIUM',
      currency: 'BRL',
      tags: [],
    });
    dealsRepository.items.push(deal);

    await sut.execute({ id: deal.id.toString(), tenantId: TENANT_ID });

    // Deal uses soft-delete via deal.delete()
    const found = await dealsRepository.findById(deal.id, TENANT_ID);
    expect(found).toBeNull();
  });

  it('should throw if deal not found', async () => {
    await expect(() =>
      sut.execute({ id: 'non-existent', tenantId: TENANT_ID }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
