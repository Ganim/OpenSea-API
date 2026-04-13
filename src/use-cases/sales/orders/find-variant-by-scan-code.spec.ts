import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryVariantsRepository } from '@/repositories/stock/in-memory/in-memory-variants-repository';
import { makeVariant } from '@/utils/tests/factories/stock/make-variant';
import { beforeEach, describe, expect, it } from 'vitest';
import { FindVariantByScanCodeUseCase } from './find-variant-by-scan-code';

let variantsRepository: InMemoryVariantsRepository;
let sut: FindVariantByScanCodeUseCase;

const tenantId = 'tenant-1';

describe('FindVariantByScanCodeUseCase', () => {
  beforeEach(() => {
    variantsRepository = new InMemoryVariantsRepository();
    sut = new FindVariantByScanCodeUseCase(variantsRepository);
  });

  it('should find a variant by barcode', async () => {
    const variant = makeVariant({
      tenantId: new UniqueEntityID(tenantId),
      barcode: 'BC12345678',
    });
    variantsRepository.items.push(variant);

    const result = await sut.execute({
      tenantId,
      code: 'BC12345678',
    });

    expect(result.variant.id.toString()).toBe(variant.id.toString());
    expect(result.matchedBy).toBe('barcode');
  });

  it('should find a variant by EAN code', async () => {
    const variant = makeVariant({
      tenantId: new UniqueEntityID(tenantId),
      barcode: undefined,
      eanCode: 'EAN1234567890',
    });
    // Clear barcode so it doesn't match first
    (variant as any).props.barcode = undefined;
    variantsRepository.items.push(variant);

    const result = await sut.execute({
      tenantId,
      code: 'EAN1234567890',
    });

    expect(result.variant.id.toString()).toBe(variant.id.toString());
    expect(result.matchedBy).toBe('ean');
  });

  it('should find a variant by SKU', async () => {
    const variant = makeVariant({
      tenantId: new UniqueEntityID(tenantId),
      sku: 'SKU-UNIQUE-001',
      barcode: undefined,
      eanCode: undefined,
      upcCode: undefined,
    });
    // Clear other codes so SKU is matched
    (variant as any).props.barcode = undefined;
    (variant as any).props.eanCode = undefined;
    (variant as any).props.upcCode = undefined;
    variantsRepository.items.push(variant);

    const result = await sut.execute({
      tenantId,
      code: 'SKU-UNIQUE-001',
    });

    expect(result.variant.id.toString()).toBe(variant.id.toString());
    expect(result.matchedBy).toBe('sku');
  });

  it('should throw BadRequestError for empty scan code', async () => {
    await expect(
      sut.execute({ tenantId, code: '   ' }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw ResourceNotFoundError when no variant matches', async () => {
    await expect(
      sut.execute({ tenantId, code: 'NONEXISTENT' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw BadRequestError if matched variant is inactive', async () => {
    const variant = makeVariant({
      tenantId: new UniqueEntityID(tenantId),
      barcode: 'INACTIVE-CODE',
    });
    (variant as any).props.isActive = false;
    variantsRepository.items.push(variant);

    await expect(
      sut.execute({ tenantId, code: 'INACTIVE-CODE' }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
