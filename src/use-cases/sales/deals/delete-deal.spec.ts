import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryDealsRepository } from '@/repositories/sales/in-memory/in-memory-deals-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteDealUseCase } from './delete-deal';

let dealsRepository: InMemoryDealsRepository;
let sut: DeleteDealUseCase;

const TENANT_ID = 'tenant-1';

describe('DeleteDealUseCase', () => {
  beforeEach(() => {
    dealsRepository = new InMemoryDealsRepository();
    sut = new DeleteDealUseCase(dealsRepository);
  });

  it('should soft delete a deal', async () => {
    const created = await dealsRepository.create({
      tenantId: TENANT_ID,
      title: 'Deal to Delete',
      customerId: 'customer-1',
      pipelineId: 'pipeline-1',
      stageId: 'stage-1',
    });

    await sut.execute({
      id: created.id.toString(),
      tenantId: TENANT_ID,
    });

    // Deal should be soft deleted (deletedAt set)
    const deal = dealsRepository.items.find(
      (item) => item.id.toString() === created.id.toString(),
    );
    expect(deal).toBeDefined();
    expect(deal!.deletedAt).toBeDefined();
    expect(deal!.isDeleted).toBe(true);
  });

  it('should throw ResourceNotFoundError when deal does not exist', async () => {
    await expect(
      sut.execute({
        id: 'non-existent-id',
        tenantId: TENANT_ID,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
