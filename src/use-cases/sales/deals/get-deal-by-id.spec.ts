import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryDealsRepository } from '@/repositories/sales/in-memory/in-memory-deals-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetDealByIdUseCase } from './get-deal-by-id';

let dealsRepository: InMemoryDealsRepository;
let sut: GetDealByIdUseCase;

const TENANT_ID = 'tenant-1';

describe('GetDealByIdUseCase', () => {
  beforeEach(() => {
    dealsRepository = new InMemoryDealsRepository();
    sut = new GetDealByIdUseCase(dealsRepository);
  });

  it('should return a deal when found', async () => {
    const created = await dealsRepository.create({
      tenantId: TENANT_ID,
      title: 'Big Deal',
      customerId: 'customer-1',
      pipelineId: 'pipeline-1',
      stageId: 'stage-1',
      value: 5000,
    });

    const result = await sut.execute({
      id: created.id.toString(),
      tenantId: TENANT_ID,
    });

    expect(result.deal.id.toString()).toBe(created.id.toString());
    expect(result.deal.title).toBe('Big Deal');
    expect(result.deal.value).toBe(5000);
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
