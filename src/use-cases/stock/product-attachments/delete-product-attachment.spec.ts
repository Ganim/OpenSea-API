import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryProductAttachmentsRepository } from '@/repositories/stock/in-memory/in-memory-product-attachments-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteProductAttachmentUseCase } from './delete-product-attachment';

let productAttachmentsRepository: InMemoryProductAttachmentsRepository;
let sut: DeleteProductAttachmentUseCase;

const TENANT_ID = 'tenant-1';
const PRODUCT_ID = 'product-1';

describe('DeleteProductAttachmentUseCase', () => {
  beforeEach(() => {
    productAttachmentsRepository = new InMemoryProductAttachmentsRepository();

    sut = new DeleteProductAttachmentUseCase(productAttachmentsRepository);
  });

  it('should delete a product attachment', async () => {
    const created = await productAttachmentsRepository.create({
      productId: PRODUCT_ID,
      tenantId: TENANT_ID,
      fileUrl: 'https://storage.example.com/files/photo.jpg',
      fileName: 'photo.jpg',
      fileSize: 102400,
      mimeType: 'image/jpeg',
      order: 0,
    });

    await sut.execute({
      id: created.id,
      tenantId: TENANT_ID,
    });

    const found = await productAttachmentsRepository.findById(created.id);
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
    const created = await productAttachmentsRepository.create({
      productId: PRODUCT_ID,
      tenantId: TENANT_ID,
      fileUrl: 'https://storage.example.com/files/photo.jpg',
      fileName: 'photo.jpg',
      fileSize: 102400,
      mimeType: 'image/jpeg',
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
