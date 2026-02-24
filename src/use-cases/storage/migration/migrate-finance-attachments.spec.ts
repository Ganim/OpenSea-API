import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import { InMemoryStorageFileVersionsRepository } from '@/repositories/storage/in-memory/in-memory-storage-file-versions-repository';
import { InMemoryStorageFoldersRepository } from '@/repositories/storage/in-memory/in-memory-storage-folders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  MigrateFinanceAttachmentsUseCase,
  type FinanceAttachmentReader,
  type FinanceAttachmentRecord,
} from './migrate-finance-attachments';

const TENANT_ID = new UniqueEntityID().toString();

class InMemoryFinanceAttachmentReader implements FinanceAttachmentReader {
  public items: FinanceAttachmentRecord[] = [];

  async findAllByTenant(tenantId: string): Promise<FinanceAttachmentRecord[]> {
    return this.items.filter((attachment) => attachment.tenantId === tenantId);
  }
}

let storageFilesRepository: InMemoryStorageFilesRepository;
let storageFileVersionsRepository: InMemoryStorageFileVersionsRepository;
let storageFoldersRepository: InMemoryStorageFoldersRepository;
let financeAttachmentReader: InMemoryFinanceAttachmentReader;
let sut: MigrateFinanceAttachmentsUseCase;

describe('MigrateFinanceAttachmentsUseCase', () => {
  beforeEach(() => {
    storageFilesRepository = new InMemoryStorageFilesRepository();
    storageFileVersionsRepository = new InMemoryStorageFileVersionsRepository();
    storageFoldersRepository = new InMemoryStorageFoldersRepository();
    financeAttachmentReader = new InMemoryFinanceAttachmentReader();
    sut = new MigrateFinanceAttachmentsUseCase(
      storageFilesRepository,
      storageFileVersionsRepository,
      storageFoldersRepository,
      financeAttachmentReader,
    );
  });

  it('should migrate all attachments successfully', async () => {
    financeAttachmentReader.items = [
      {
        id: 'attachment-1',
        tenantId: TENANT_ID,
        entryId: 'entry-1',
        type: 'BOLETO',
        fileName: 'boleto-janeiro.pdf',
        fileKey: 'finance/tenant/boleto-janeiro.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        uploadedBy: 'user-1',
        createdAt: new Date('2025-01-15'),
      },
      {
        id: 'attachment-2',
        tenantId: TENANT_ID,
        entryId: 'entry-2',
        type: 'PAYMENT_RECEIPT',
        fileName: 'comprovante-fevereiro.pdf',
        fileKey: 'finance/tenant/comprovante-fevereiro.pdf',
        fileSize: 2048,
        mimeType: 'application/pdf',
        uploadedBy: 'user-2',
        createdAt: new Date('2025-02-10'),
      },
    ];

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.migratedCount).toBe(2);
    expect(result.skippedCount).toBe(0);
    expect(result.totalAttachments).toBe(2);

    // Verify StorageFiles were created
    expect(storageFilesRepository.items).toHaveLength(2);

    const boletoFile = storageFilesRepository.items.find(
      (file) => file.name === 'boleto-janeiro.pdf',
    );
    expect(boletoFile).toBeDefined();
    expect(boletoFile!.fileKey).toBe('finance/tenant/boleto-janeiro.pdf');
    expect(boletoFile!.fileType).toBe('BOLETO');
    expect(boletoFile!.entityType).toBe('finance_entry');
    expect(boletoFile!.entityId).toBe('entry-1');

    const comprovanteFile = storageFilesRepository.items.find(
      (file) => file.name === 'comprovante-fevereiro.pdf',
    );
    expect(comprovanteFile).toBeDefined();
    expect(comprovanteFile!.fileType).toBe('COMPROVANTE');
  });

  it('should skip already-migrated files (idempotent)', async () => {
    financeAttachmentReader.items = [
      {
        id: 'attachment-1',
        tenantId: TENANT_ID,
        entryId: 'entry-1',
        type: 'BOLETO',
        fileName: 'boleto-janeiro.pdf',
        fileKey: 'finance/tenant/boleto-janeiro.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        uploadedBy: 'user-1',
        createdAt: new Date('2025-01-15'),
      },
    ];

    // First migration
    const firstResult = await sut.execute({ tenantId: TENANT_ID });
    expect(firstResult.migratedCount).toBe(1);
    expect(firstResult.skippedCount).toBe(0);

    // Second migration (should skip)
    const secondResult = await sut.execute({ tenantId: TENANT_ID });
    expect(secondResult.migratedCount).toBe(0);
    expect(secondResult.skippedCount).toBe(1);
    expect(secondResult.totalAttachments).toBe(1);

    // Should still have only 1 file
    expect(storageFilesRepository.items).toHaveLength(1);
  });

  it('should create file versions for each migrated file', async () => {
    financeAttachmentReader.items = [
      {
        id: 'attachment-1',
        tenantId: TENANT_ID,
        entryId: 'entry-1',
        type: 'CONTRACT',
        fileName: 'contrato.pdf',
        fileKey: 'finance/tenant/contrato.pdf',
        fileSize: 4096,
        mimeType: 'application/pdf',
        uploadedBy: 'user-1',
        createdAt: new Date('2025-03-01'),
      },
    ];

    await sut.execute({ tenantId: TENANT_ID });

    // Verify StorageFileVersion was created
    expect(storageFileVersionsRepository.items).toHaveLength(1);

    const version = storageFileVersionsRepository.items[0];
    expect(version.version).toBe(1);
    expect(version.fileKey).toBe('finance/tenant/contrato.pdf');
    expect(version.size).toBe(4096);
    expect(version.mimeType).toBe('application/pdf');
    expect(version.changeNote).toBe('Migrated from FinanceAttachment');
    expect(version.uploadedBy).toBe('user-1');
  });

  it('should return correct counts', async () => {
    financeAttachmentReader.items = [
      {
        id: 'attachment-1',
        tenantId: TENANT_ID,
        entryId: 'entry-1',
        type: 'BOLETO',
        fileName: 'boleto.pdf',
        fileKey: 'finance/tenant/boleto.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        uploadedBy: 'user-1',
        createdAt: new Date(),
      },
      {
        id: 'attachment-2',
        tenantId: TENANT_ID,
        entryId: 'entry-2',
        type: 'OTHER',
        fileName: 'outro-doc.pdf',
        fileKey: 'finance/tenant/outro-doc.pdf',
        fileSize: 512,
        mimeType: 'application/pdf',
        uploadedBy: null,
        createdAt: new Date(),
      },
    ];

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.totalAttachments).toBe(2);
    expect(result.migratedCount).toBe(2);
    expect(result.skippedCount).toBe(0);

    // Verify the file with null uploadedBy used 'system-migration'
    const otherDocFile = storageFilesRepository.items.find(
      (file) => file.name === 'outro-doc.pdf',
    );
    expect(otherDocFile).toBeDefined();
    expect(otherDocFile!.uploadedBy).toBe('system-migration');
  });

  it('should handle empty attachment list', async () => {
    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.migratedCount).toBe(0);
    expect(result.skippedCount).toBe(0);
    expect(result.totalAttachments).toBe(0);
    expect(storageFilesRepository.items).toHaveLength(0);
    expect(storageFileVersionsRepository.items).toHaveLength(0);
  });

  it('should create the migration folder structure if it does not exist', async () => {
    financeAttachmentReader.items = [
      {
        id: 'attachment-1',
        tenantId: TENANT_ID,
        entryId: 'entry-1',
        type: 'BOLETO',
        fileName: 'boleto.pdf',
        fileKey: 'finance/tenant/boleto.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        uploadedBy: 'user-1',
        createdAt: new Date(),
      },
    ];

    await sut.execute({ tenantId: TENANT_ID });

    // Should have created /financeiro and /financeiro/anexos-migrados
    const financeiroFolder = storageFoldersRepository.items.find(
      (folder) => folder.path === '/financeiro',
    );
    expect(financeiroFolder).toBeDefined();
    expect(financeiroFolder!.isSystem).toBe(true);
    expect(financeiroFolder!.module).toBe('finance');

    const migrationFolder = storageFoldersRepository.items.find(
      (folder) => folder.path === '/financeiro/anexos-migrados',
    );
    expect(migrationFolder).toBeDefined();
    expect(migrationFolder!.isSystem).toBe(true);
    expect(migrationFolder!.parentId?.toString()).toBe(
      financeiroFolder!.id.toString(),
    );
  });

  it('should reuse existing migration folder on subsequent runs', async () => {
    financeAttachmentReader.items = [
      {
        id: 'attachment-1',
        tenantId: TENANT_ID,
        entryId: 'entry-1',
        type: 'BOLETO',
        fileName: 'boleto-1.pdf',
        fileKey: 'finance/tenant/boleto-1.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        uploadedBy: 'user-1',
        createdAt: new Date(),
      },
    ];

    // First run creates the folder
    await sut.execute({ tenantId: TENANT_ID });
    const folderCountAfterFirstRun = storageFoldersRepository.items.length;

    // Add another attachment
    financeAttachmentReader.items.push({
      id: 'attachment-2',
      tenantId: TENANT_ID,
      entryId: 'entry-2',
      type: 'BOLETO',
      fileName: 'boleto-2.pdf',
      fileKey: 'finance/tenant/boleto-2.pdf',
      fileSize: 2048,
      mimeType: 'application/pdf',
      uploadedBy: 'user-2',
      createdAt: new Date(),
    });

    // Second run should NOT create new folders
    await sut.execute({ tenantId: TENANT_ID });
    expect(storageFoldersRepository.items.length).toBe(
      folderCountAfterFirstRun,
    );
  });

  it('should correctly map different attachment types to file types', async () => {
    financeAttachmentReader.items = [
      {
        id: 'att-boleto',
        tenantId: TENANT_ID,
        entryId: 'entry-1',
        type: 'BOLETO',
        fileName: 'boleto.pdf',
        fileKey: 'finance/boleto.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        uploadedBy: 'user-1',
        createdAt: new Date(),
      },
      {
        id: 'att-receipt',
        tenantId: TENANT_ID,
        entryId: 'entry-2',
        type: 'PAYMENT_RECEIPT',
        fileName: 'comprovante.pdf',
        fileKey: 'finance/comprovante.pdf',
        fileSize: 512,
        mimeType: 'application/pdf',
        uploadedBy: 'user-1',
        createdAt: new Date(),
      },
      {
        id: 'att-invoice',
        tenantId: TENANT_ID,
        entryId: 'entry-3',
        type: 'INVOICE',
        fileName: 'nota-fiscal.xml',
        fileKey: 'finance/nota-fiscal.xml',
        fileSize: 2048,
        mimeType: 'application/xml',
        uploadedBy: 'user-1',
        createdAt: new Date(),
      },
      {
        id: 'att-contract',
        tenantId: TENANT_ID,
        entryId: 'entry-4',
        type: 'CONTRACT',
        fileName: 'contrato.pdf',
        fileKey: 'finance/contrato.pdf',
        fileSize: 8192,
        mimeType: 'application/pdf',
        uploadedBy: 'user-1',
        createdAt: new Date(),
      },
      {
        id: 'att-other',
        tenantId: TENANT_ID,
        entryId: 'entry-5',
        type: 'OTHER',
        fileName: 'outro.pdf',
        fileKey: 'finance/outro.pdf',
        fileSize: 256,
        mimeType: 'application/pdf',
        uploadedBy: 'user-1',
        createdAt: new Date(),
      },
    ];

    await sut.execute({ tenantId: TENANT_ID });

    const filesByName = new Map(
      storageFilesRepository.items.map((file) => [file.name, file]),
    );

    expect(filesByName.get('boleto.pdf')!.fileType).toBe('BOLETO');
    expect(filesByName.get('comprovante.pdf')!.fileType).toBe('COMPROVANTE');
    expect(filesByName.get('nota-fiscal.xml')!.fileType).toBe('NFE');
    expect(filesByName.get('contrato.pdf')!.fileType).toBe('DOCUMENT');
    expect(filesByName.get('outro.pdf')!.fileType).toBe('DOCUMENT');
  });
});
