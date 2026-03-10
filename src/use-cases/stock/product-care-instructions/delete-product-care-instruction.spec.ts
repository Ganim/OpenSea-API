import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryProductCareInstructionsRepository } from '@/repositories/stock/in-memory/in-memory-product-care-instructions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteProductCareInstructionUseCase } from './delete-product-care-instruction';

let productCareInstructionsRepository: InMemoryProductCareInstructionsRepository;
let sut: DeleteProductCareInstructionUseCase;

const TENANT_ID = 'tenant-1';
const PRODUCT_ID = 'product-1';

describe('DeleteProductCareInstructionUseCase', () => {
  beforeEach(() => {
    productCareInstructionsRepository =
      new InMemoryProductCareInstructionsRepository();

    sut = new DeleteProductCareInstructionUseCase(
      productCareInstructionsRepository,
    );
  });

  it('should delete a product care instruction', async () => {
    const created = await productCareInstructionsRepository.create({
      productId: PRODUCT_ID,
      tenantId: TENANT_ID,
      careInstructionId: 'WASH_30',
      order: 0,
    });

    await sut.execute({
      id: created.id,
      tenantId: TENANT_ID,
    });

    const found = await productCareInstructionsRepository.findById(created.id);
    expect(found).toBeNull();
  });

  it('should throw when not found', async () => {
    await expect(
      sut.execute({
        id: 'non-existent-id',
        tenantId: TENANT_ID,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw when belongs to different tenant', async () => {
    const created = await productCareInstructionsRepository.create({
      productId: PRODUCT_ID,
      tenantId: TENANT_ID,
      careInstructionId: 'WASH_30',
      order: 0,
    });

    await expect(
      sut.execute({
        id: created.id,
        tenantId: 'different-tenant',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
