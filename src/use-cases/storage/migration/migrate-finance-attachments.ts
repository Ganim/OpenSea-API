import { slugify } from '@/constants/storage/folder-templates';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { StorageFileVersionsRepository } from '@/repositories/storage/storage-file-versions-repository';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';

/**
 * Represents a FinanceAttachment record as read from the database.
 * Used to decouple the use case from the Prisma client for testability.
 */
export interface FinanceAttachmentRecord {
  id: string;
  tenantId: string;
  entryId: string;
  type: string;
  fileName: string;
  fileKey: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string | null;
  createdAt: Date;
}

/**
 * Interface for reading FinanceAttachment records.
 * In production, this is implemented by a Prisma query.
 * In tests, this is implemented by an in-memory store.
 */
export interface FinanceAttachmentReader {
  findAllByTenant(tenantId: string): Promise<FinanceAttachmentRecord[]>;
}

interface MigrateFinanceAttachmentsUseCaseRequest {
  tenantId: string;
}

interface MigrateFinanceAttachmentsUseCaseResponse {
  migratedCount: number;
  skippedCount: number;
  totalAttachments: number;
}

const FINANCE_ATTACHMENTS_FOLDER_PATH = '/financeiro/anexos-migrados';
const FINANCE_ATTACHMENTS_FOLDER_NAME = 'Anexos Financeiros (Migrados)';

/**
 * Maps FinanceAttachmentType to a storage file type.
 * This determines which filter folders the migrated files appear in.
 */
function mapAttachmentTypeToFileType(attachmentType: string): string {
  const typeMapping: Record<string, string> = {
    BOLETO: 'BOLETO',
    PAYMENT_RECEIPT: 'COMPROVANTE',
    CONTRACT: 'DOCUMENT',
    INVOICE: 'NFE',
    OTHER: 'DOCUMENT',
  };

  return typeMapping[attachmentType] ?? 'DOCUMENT';
}

export class MigrateFinanceAttachmentsUseCase {
  constructor(
    private storageFilesRepository: StorageFilesRepository,
    private storageFileVersionsRepository: StorageFileVersionsRepository,
    private storageFoldersRepository: StorageFoldersRepository,
    private financeAttachmentReader: FinanceAttachmentReader,
  ) {}

  async execute(
    request: MigrateFinanceAttachmentsUseCaseRequest,
  ): Promise<MigrateFinanceAttachmentsUseCaseResponse> {
    const { tenantId } = request;

    // Step 1: Find or create the finance attachments migration folder
    const migrationFolder = await this.findOrCreateMigrationFolder(tenantId);

    // Step 2: Read all FinanceAttachment records for this tenant
    const attachments =
      await this.financeAttachmentReader.findAllByTenant(tenantId);

    const totalAttachments = attachments.length;
    let migratedCount = 0;
    let skippedCount = 0;

    // Step 3: Process each attachment
    for (const attachment of attachments) {
      // Check if a StorageFile with the same fileKey already exists (idempotent)
      const existingFile = await this.storageFilesRepository.findByPath(
        `${FINANCE_ATTACHMENTS_FOLDER_PATH}/${attachment.fileName}`,
        tenantId,
      );

      if (existingFile) {
        skippedCount++;
        continue;
      }

      const fileType = mapAttachmentTypeToFileType(attachment.type);
      const filePath = `${FINANCE_ATTACHMENTS_FOLDER_PATH}/${attachment.fileName}`;

      // Step 3a: Create StorageFile record pointing to the SAME R2 fileKey
      const createdFile = await this.storageFilesRepository.create({
        tenantId,
        folderId: migrationFolder.id.toString(),
        name: attachment.fileName,
        originalName: attachment.fileName,
        fileKey: attachment.fileKey,
        path: filePath,
        size: attachment.fileSize,
        mimeType: attachment.mimeType,
        fileType,
        entityType: 'finance_entry',
        entityId: attachment.entryId,
        uploadedBy: attachment.uploadedBy ?? 'system-migration',
      });

      // Step 3b: Create StorageFileVersion v1 for each file
      await this.storageFileVersionsRepository.create({
        fileId: createdFile.id.toString(),
        version: 1,
        fileKey: attachment.fileKey,
        size: attachment.fileSize,
        mimeType: attachment.mimeType,
        changeNote: 'Migrated from FinanceAttachment',
        uploadedBy: attachment.uploadedBy ?? 'system-migration',
      });

      migratedCount++;
    }

    return {
      migratedCount,
      skippedCount,
      totalAttachments,
    };
  }

  private async findOrCreateMigrationFolder(tenantId: string) {
    const existingFolder = await this.storageFoldersRepository.findByPath(
      FINANCE_ATTACHMENTS_FOLDER_PATH,
      tenantId,
    );

    if (existingFolder) {
      return existingFolder;
    }

    // Ensure the parent /financeiro folder exists
    const financeFolderPath = '/financeiro';
    let parentFolder = await this.storageFoldersRepository.findByPath(
      financeFolderPath,
      tenantId,
    );

    if (!parentFolder) {
      parentFolder = await this.storageFoldersRepository.create({
        tenantId,
        name: 'Financeiro',
        slug: slugify('Financeiro'),
        path: financeFolderPath,
        icon: 'wallet',
        isSystem: true,
        module: 'finance',
        depth: 0,
      });
    }

    const migrationFolder = await this.storageFoldersRepository.create({
      tenantId,
      parentId: parentFolder.id.toString(),
      name: FINANCE_ATTACHMENTS_FOLDER_NAME,
      slug: slugify(FINANCE_ATTACHMENTS_FOLDER_NAME),
      path: FINANCE_ATTACHMENTS_FOLDER_PATH,
      icon: 'file-stack',
      isSystem: true,
      module: 'finance',
      depth: 1,
    });

    return migrationFolder;
  }
}
