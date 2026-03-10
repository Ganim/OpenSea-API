import { InMemoryVariantAttachmentsRepository } from '@/repositories/stock/in-memory/in-memory-variant-attachments-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListVariantAttachmentsUseCase } from './list-variant-attachments';

let variantAttachmentsRepository: InMemoryVariantAttachmentsRepository;
let sut: ListVariantAttachmentsUseCase;

const TENANT_ID = 'tenant-1';
const VARIANT_ID = 'variant-1';

describe('ListVariantAttachmentsUseCase', () => {
  beforeEach(() => {
    variantAttachmentsRepository =
      new InMemoryVariantAttachmentsRepository();

    sut = new ListVariantAttachmentsUseCase(
      variantAttachmentsRepository,
    );
  });

  it('should return ordered list of attachments', async () => {
    await variantAttachmentsRepository.create({
      variantId: VARIANT_ID,
      tenantId: TENANT_ID,
      fileUrl: 'https://storage.example.com/files/doc.pdf',
      fileName: 'doc.pdf',
      fileSize: 204800,
      mimeType: 'application/pdf',
      order: 2,
    });

    await variantAttachmentsRepository.create({
      variantId: VARIANT_ID,
      tenantId: TENANT_ID,
      fileUrl: 'https://storage.example.com/files/photo.jpg',
      fileName: 'photo.jpg',
      fileSize: 102400,
      mimeType: 'image/jpeg',
      order: 1,
    });

    await variantAttachmentsRepository.create({
      variantId: VARIANT_ID,
      tenantId: TENANT_ID,
      fileUrl: 'https://storage.example.com/files/spec.xlsx',
      fileName: 'spec.xlsx',
      fileSize: 51200,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      order: 3,
    });

    const result = await sut.execute({
      variantId: VARIANT_ID,
      tenantId: TENANT_ID,
    });

    expect(result.variantAttachments).toHaveLength(3);
    expect(result.variantAttachments[0].fileName).toBe('photo.jpg');
    expect(result.variantAttachments[1].fileName).toBe('doc.pdf');
    expect(result.variantAttachments[2].fileName).toBe('spec.xlsx');
  });

  it('should return empty array when none exist', async () => {
    const result = await sut.execute({
      variantId: VARIANT_ID,
      tenantId: TENANT_ID,
    });

    expect(result.variantAttachments).toHaveLength(0);
    expect(result.variantAttachments).toEqual([]);
  });
});
