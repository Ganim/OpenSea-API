import { InMemoryProductAttachmentsRepository } from '@/repositories/stock/in-memory/in-memory-product-attachments-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListProductAttachmentsUseCase } from './list-product-attachments';

let productAttachmentsRepository: InMemoryProductAttachmentsRepository;
let sut: ListProductAttachmentsUseCase;

const TENANT_ID = 'tenant-1';
const PRODUCT_ID = 'product-1';

describe('ListProductAttachmentsUseCase', () => {
  beforeEach(() => {
    productAttachmentsRepository =
      new InMemoryProductAttachmentsRepository();

    sut = new ListProductAttachmentsUseCase(
      productAttachmentsRepository,
    );
  });

  it('should return ordered list of attachments', async () => {
    await productAttachmentsRepository.create({
      productId: PRODUCT_ID,
      tenantId: TENANT_ID,
      fileUrl: 'https://storage.example.com/files/doc.pdf',
      fileName: 'doc.pdf',
      fileSize: 204800,
      mimeType: 'application/pdf',
      order: 2,
    });

    await productAttachmentsRepository.create({
      productId: PRODUCT_ID,
      tenantId: TENANT_ID,
      fileUrl: 'https://storage.example.com/files/photo.jpg',
      fileName: 'photo.jpg',
      fileSize: 102400,
      mimeType: 'image/jpeg',
      order: 1,
    });

    await productAttachmentsRepository.create({
      productId: PRODUCT_ID,
      tenantId: TENANT_ID,
      fileUrl: 'https://storage.example.com/files/spec.xlsx',
      fileName: 'spec.xlsx',
      fileSize: 51200,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      order: 3,
    });

    const result = await sut.execute({
      productId: PRODUCT_ID,
      tenantId: TENANT_ID,
    });

    expect(result.productAttachments).toHaveLength(3);
    expect(result.productAttachments[0].fileName).toBe('photo.jpg');
    expect(result.productAttachments[1].fileName).toBe('doc.pdf');
    expect(result.productAttachments[2].fileName).toBe('spec.xlsx');
  });

  it('should return empty array when none exist', async () => {
    const result = await sut.execute({
      productId: PRODUCT_ID,
      tenantId: TENANT_ID,
    });

    expect(result.productAttachments).toHaveLength(0);
    expect(result.productAttachments).toEqual([]);
  });
});
