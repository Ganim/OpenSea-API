import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryVariantAttachmentsRepository } from '@/repositories/stock/in-memory/in-memory-variant-attachments-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteVariantAttachmentUseCase } from './delete-variant-attachment';

let variantAttachmentsRepository: InMemoryVariantAttachmentsRepository;
let sut: DeleteVariantAttachmentUseCase;

const TENANT_ID = 'tenant-1';
const VARIANT_ID = 'variant-1';

describe('DeleteVariantAttachmentUseCase', () => {
  beforeEach(() => {
    variantAttachmentsRepository =
      new InMemoryVariantAttachmentsRepository();

    sut = new DeleteVariantAttachmentUseCase(
      variantAttachmentsRepository,
    );
  });

  it('should delete a variant attachment', async () => {
    const created = await variantAttachmentsRepository.create({
      variantId: VARIANT_ID,
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

    const found = await variantAttachmentsRepository.findById(created.id);
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
    const created = await variantAttachmentsRepository.create({
      variantId: VARIANT_ID,
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
