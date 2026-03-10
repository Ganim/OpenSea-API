import { InMemoryProductCareInstructionsRepository } from '@/repositories/stock/in-memory/in-memory-product-care-instructions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListProductCareInstructionsUseCase } from './list-product-care-instructions';

let productCareInstructionsRepository: InMemoryProductCareInstructionsRepository;
let sut: ListProductCareInstructionsUseCase;

const TENANT_ID = 'tenant-1';
const PRODUCT_ID = 'product-1';

describe('ListProductCareInstructionsUseCase', () => {
  beforeEach(() => {
    productCareInstructionsRepository =
      new InMemoryProductCareInstructionsRepository();

    sut = new ListProductCareInstructionsUseCase(
      productCareInstructionsRepository,
    );
  });

  it('should return ordered list of care instructions', async () => {
    await productCareInstructionsRepository.create({
      productId: PRODUCT_ID,
      tenantId: TENANT_ID,
      careInstructionId: 'WASH_30',
      order: 2,
    });

    await productCareInstructionsRepository.create({
      productId: PRODUCT_ID,
      tenantId: TENANT_ID,
      careInstructionId: 'DO_NOT_BLEACH',
      order: 1,
    });

    await productCareInstructionsRepository.create({
      productId: PRODUCT_ID,
      tenantId: TENANT_ID,
      careInstructionId: 'IRON_110',
      order: 3,
    });

    const result = await sut.execute({
      productId: PRODUCT_ID,
      tenantId: TENANT_ID,
    });

    expect(result.productCareInstructions).toHaveLength(3);
    expect(result.productCareInstructions[0].careInstructionId).toBe(
      'DO_NOT_BLEACH',
    );
    expect(result.productCareInstructions[1].careInstructionId).toBe('WASH_30');
    expect(result.productCareInstructions[2].careInstructionId).toBe(
      'IRON_110',
    );
  });

  it('should return empty array when none exist', async () => {
    const result = await sut.execute({
      productId: PRODUCT_ID,
      tenantId: TENANT_ID,
    });

    expect(result.productCareInstructions).toHaveLength(0);
    expect(result.productCareInstructions).toEqual([]);
  });
});
