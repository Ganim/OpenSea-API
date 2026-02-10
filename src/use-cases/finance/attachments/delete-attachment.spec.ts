import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryFinanceAttachmentsRepository } from '@/repositories/finance/in-memory/in-memory-finance-attachments-repository';
import type { FileUploadService } from '@/services/storage/file-upload-service';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeleteAttachmentUseCase } from './delete-attachment';

let attachmentsRepository: InMemoryFinanceAttachmentsRepository;
let mockFileUploadService: FileUploadService;
let sut: DeleteAttachmentUseCase;

let seededAttachmentId: string;

function createMockFileUploadService(): FileUploadService {
  return {
    upload: vi.fn().mockResolvedValue({
      key: 'test-key',
      url: 'https://storage.example.com/test.pdf',
      size: 1024,
      mimeType: 'application/pdf',
    }),
    getPresignedUrl: vi.fn().mockResolvedValue('https://storage.example.com/presigned/test.pdf'),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

describe('DeleteAttachmentUseCase', () => {
  beforeEach(async () => {
    attachmentsRepository = new InMemoryFinanceAttachmentsRepository();
    mockFileUploadService = createMockFileUploadService();
    sut = new DeleteAttachmentUseCase(attachmentsRepository, mockFileUploadService);

    // Seed an attachment
    const attachment = await attachmentsRepository.create({
      tenantId: 'tenant-1',
      entryId: 'entry-1',
      type: 'BOLETO',
      fileName: 'boleto.pdf',
      fileKey: 'finance/tenant-1/entry-1/boleto.pdf',
      fileSize: 1024,
      mimeType: 'application/pdf',
      uploadedBy: 'user-1',
    });
    seededAttachmentId = attachment.id.toString();
  });

  it('should delete an attachment from storage and database', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      entryId: 'entry-1',
      attachmentId: seededAttachmentId,
    });

    expect(attachmentsRepository.items).toHaveLength(0);
    expect(mockFileUploadService.delete).toHaveBeenCalledWith(
      'finance/tenant-1/entry-1/boleto.pdf',
    );
  });

  it('should throw if attachment does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        entryId: 'entry-1',
        attachmentId: 'non-existent-id',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw if attachment belongs to different tenant', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-2',
        entryId: 'entry-1',
        attachmentId: seededAttachmentId,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
