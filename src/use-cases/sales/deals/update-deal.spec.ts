import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryDealsRepository } from '@/repositories/sales/in-memory/in-memory-deals-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateDealUseCase } from './update-deal';

let dealsRepository: InMemoryDealsRepository;
let sut: UpdateDealUseCase;

const TENANT_ID = 'tenant-1';

describe('UpdateDealUseCase', () => {
  beforeEach(() => {
    dealsRepository = new InMemoryDealsRepository();
    sut = new UpdateDealUseCase(dealsRepository);
  });

  it('should update deal title', async () => {
    const created = await dealsRepository.create({
      tenantId: TENANT_ID,
      title: 'Old Title',
      customerId: 'customer-1',
      pipelineId: 'pipeline-1',
      stageId: 'stage-1',
    });

    const result = await sut.execute({
      id: created.id.toString(),
      tenantId: TENANT_ID,
      title: 'New Title',
    });

    expect(result.deal.title).toBe('New Title');
  });

  it('should update deal value', async () => {
    const created = await dealsRepository.create({
      tenantId: TENANT_ID,
      title: 'Deal',
      customerId: 'customer-1',
      pipelineId: 'pipeline-1',
      stageId: 'stage-1',
      value: 1000,
    });

    const result = await sut.execute({
      id: created.id.toString(),
      tenantId: TENANT_ID,
      value: 5000,
    });

    expect(result.deal.value).toBe(5000);
  });

  it('should throw ResourceNotFoundError when deal does not exist', async () => {
    await expect(
      sut.execute({
        id: 'non-existent-id',
        tenantId: TENANT_ID,
        title: 'New Title',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
