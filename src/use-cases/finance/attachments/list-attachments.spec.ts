import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryFinanceAttachmentsRepository } from '@/repositories/finance/in-memory/in-memory-finance-attachments-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryFinanceCategoriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-categories-repository';
import { InMemoryCostCentersRepository } from '@/repositories/finance/in-memory/in-memory-cost-centers-repository';
import type { FileUploadService } from '@/services/storage/file-upload-service';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ListAttachmentsUseCase } from './list-attachments';

let entriesRepository: InMemoryFinanceEntriesRepository;
let attachmentsRepository: InMemoryFinanceAttachmentsRepository;
let categoriesRepository: InMemoryFinanceCategoriesRepository;
let costCentersRepository: InMemoryCostCentersRepository;
let mockFileUploadService: FileUploadService;
let sut: ListAttachmentsUseCase;

let seededEntryId: string;

function createMockFileUploadService(): FileUploadService {
  return {
    upload: vi.fn().mockResolvedValue({
      key: 'test-key',
      url: 'https://storage.example.com/test.pdf',
      size: 1024,
      mimeType: 'application/pdf',
    }),
    getPresignedUrl: vi.fn().mockImplementation(
      (key: string) => Promise.resolve(`https://storage.example.com/presigned/${key}`),
    ),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

describe('ListAttachmentsUseCase', () => {
  beforeEach(async () => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    attachmentsRepository = new InMemoryFinanceAttachmentsRepository();
    categoriesRepository = new InMemoryFinanceCategoriesRepository();
    costCentersRepository = new InMemoryCostCentersRepository();
    mockFileUploadService = createMockFileUploadService();

    sut = new ListAttachmentsUseCase(
      entriesRepository,
      attachmentsRepository,
      mockFileUploadService,
    );

    // Seed category + cost center + entry
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

  it('should list attachments for an entry with presigned URLs', async () => {
    await attachmentsRepository.create({
      tenantId: 'tenant-1',
      entryId: seededEntryId,
      type: 'BOLETO',
      fileName: 'boleto.pdf',
      fileKey: 'finance/tenant-1/boleto.pdf',
      fileSize: 1024,
      mimeType: 'application/pdf',
    });

    await attachmentsRepository.create({
      tenantId: 'tenant-1',
      entryId: seededEntryId,
      type: 'PAYMENT_RECEIPT',
      fileName: 'comprovante.jpg',
      fileKey: 'finance/tenant-1/comprovante.jpg',
      fileSize: 2048,
      mimeType: 'image/jpeg',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId: seededEntryId,
    });

    expect(result.attachments).toHaveLength(2);
    expect(result.attachments[0].url).toContain('presigned');
    expect(result.attachments[1].url).toContain('presigned');
    expect(mockFileUploadService.getPresignedUrl).toHaveBeenCalledTimes(2);
  });

  it('should return empty array if no attachments', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId: seededEntryId,
    });

    expect(result.attachments).toHaveLength(0);
  });

  it('should throw if entry does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        entryId: 'non-existent-entry',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should only return attachments for the given entry', async () => {
    // Create entry 2
    const entry2 = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'FIN-002',
      description: 'Venda',
      categoryId: 'cat-1',
      costCenterId: 'cc-1',
      expectedAmount: 3000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-03-01'),
    });

    // Attach to entry 1
    await attachmentsRepository.create({
      tenantId: 'tenant-1',
      entryId: seededEntryId,
      type: 'BOLETO',
      fileName: 'boleto.pdf',
      fileKey: 'key-1',
      fileSize: 1024,
      mimeType: 'application/pdf',
    });

    // Attach to entry 2
    await attachmentsRepository.create({
      tenantId: 'tenant-1',
      entryId: entry2.id.toString(),
      type: 'CONTRACT',
      fileName: 'contract.pdf',
      fileKey: 'key-2',
      fileSize: 2048,
      mimeType: 'application/pdf',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId: seededEntryId,
    });

    expect(result.attachments).toHaveLength(1);
    expect(result.attachments[0].fileName).toBe('boleto.pdf');
  });
});
