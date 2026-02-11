import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryFinanceAttachmentsRepository } from '@/repositories/finance/in-memory/in-memory-finance-attachments-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryFinanceCategoriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-categories-repository';
import { InMemoryCostCentersRepository } from '@/repositories/finance/in-memory/in-memory-cost-centers-repository';
import type { FileUploadService } from '@/services/storage/file-upload-service';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UploadAttachmentUseCase } from './upload-attachment';

let entriesRepository: InMemoryFinanceEntriesRepository;
let attachmentsRepository: InMemoryFinanceAttachmentsRepository;
let categoriesRepository: InMemoryFinanceCategoriesRepository;
let costCentersRepository: InMemoryCostCentersRepository;
let mockFileUploadService: FileUploadService;
let sut: UploadAttachmentUseCase;

let seededEntryId: string;

function createMockFileUploadService(): FileUploadService {
  return {
    upload: vi.fn().mockResolvedValue({
      key: 'finance/tenant-1/entry-1/abc-test.pdf',
      url: 'https://storage.example.com/test.pdf',
      size: 1024,
      mimeType: 'application/pdf',
    }),
    getPresignedUrl: vi
      .fn()
      .mockResolvedValue('https://storage.example.com/presigned/test.pdf'),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

describe('UploadAttachmentUseCase', () => {
  beforeEach(async () => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    attachmentsRepository = new InMemoryFinanceAttachmentsRepository();
    categoriesRepository = new InMemoryFinanceCategoriesRepository();
    costCentersRepository = new InMemoryCostCentersRepository();
    mockFileUploadService = createMockFileUploadService();

    sut = new UploadAttachmentUseCase(
      entriesRepository,
      attachmentsRepository,
      mockFileUploadService,
    );

    // Seed a category + cost center + entry
    const category = await categoriesRepository.create({
      tenantId: 'tenant-1',
      name: 'Fornecedores',
      slug: 'fornecedores',
      type: 'EXPENSE',
      isActive: true,
    });

    const costCenter = await costCentersRepository.create({
      tenantId: 'tenant-1',
      code: 'CC-001',
      name: 'Administrativo',
    });

    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'FIN-001',
      description: 'Aluguel',
      categoryId: category.id.toString(),
      costCenterId: costCenter.id.toString(),
      expectedAmount: 5000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-28'),
    });
    seededEntryId = entry.id.toString();
  });

  it('should upload an attachment to an entry', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId: seededEntryId,
      type: 'BOLETO',
      fileName: 'boleto-fev.pdf',
      fileBuffer: Buffer.alloc(1024),
      mimeType: 'application/pdf',
      uploadedBy: 'user-1',
    });

    expect(result.attachment).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        entryId: seededEntryId,
        type: 'BOLETO',
        fileName: 'boleto-fev.pdf',
        mimeType: 'application/pdf',
        url: 'https://storage.example.com/presigned/test.pdf',
        uploadedBy: 'user-1',
      }),
    );
    expect(attachmentsRepository.items).toHaveLength(1);
    expect(mockFileUploadService.upload).toHaveBeenCalledOnce();
    expect(mockFileUploadService.getPresignedUrl).toHaveBeenCalledOnce();
  });

  it('should reject if entry does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        entryId: 'non-existent-id',
        type: 'BOLETO',
        fileName: 'boleto.pdf',
        fileBuffer: Buffer.alloc(1024),
        mimeType: 'application/pdf',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should reject file larger than 10MB', async () => {
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        entryId: seededEntryId,
        type: 'PAYMENT_RECEIPT',
        fileName: 'large-file.pdf',
        fileBuffer: largeBuffer,
        mimeType: 'application/pdf',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should reject invalid mime type', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        entryId: seededEntryId,
        type: 'CONTRACT',
        fileName: 'contract.docx',
        fileBuffer: Buffer.alloc(1024),
        mimeType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should handle storage upload failure', async () => {
    vi.mocked(mockFileUploadService.upload).mockRejectedValueOnce(
      new Error('S3 error'),
    );

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        entryId: seededEntryId,
        type: 'BOLETO',
        fileName: 'boleto.pdf',
        fileBuffer: Buffer.alloc(1024),
        mimeType: 'application/pdf',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should accept JPEG images', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId: seededEntryId,
      type: 'PAYMENT_RECEIPT',
      fileName: 'comprovante.jpg',
      fileBuffer: Buffer.alloc(2048),
      mimeType: 'image/jpeg',
    });

    expect(result.attachment.fileName).toBe('comprovante.jpg');
  });

  it('should accept PNG images', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId: seededEntryId,
      type: 'PAYMENT_RECEIPT',
      fileName: 'comprovante.png',
      fileBuffer: Buffer.alloc(2048),
      mimeType: 'image/png',
    });

    expect(result.attachment.fileName).toBe('comprovante.png');
  });
});
