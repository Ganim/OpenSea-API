import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';

interface BulkDeleteItemsUseCaseRequest {
  tenantId: string;
  fileIds?: string[];
  folderIds?: string[];
}

interface BulkDeleteItemsUseCaseResponse {
  deletedFiles: number;
  deletedFolders: number;
  errors: string[];
}

export class BulkDeleteItemsUseCase {
  constructor(
    private storageFilesRepository: StorageFilesRepository,
    private storageFoldersRepository: StorageFoldersRepository,
  ) {}

  async execute(
    request: BulkDeleteItemsUseCaseRequest,
  ): Promise<BulkDeleteItemsUseCaseResponse> {
    const { tenantId, fileIds = [], folderIds = [] } = request;

    if (fileIds.length === 0 && folderIds.length === 0) {
      throw new BadRequestError('No items provided for deletion');
    }

    let deletedFiles = 0;
    let deletedFolders = 0;
    const errors: string[] = [];

    // Delete individual files
    for (const fileId of fileIds) {
      try {
        const file = await this.storageFilesRepository.findById(
          new UniqueEntityID(fileId),
          tenantId,
        );

        if (!file) {
          errors.push(`File ${fileId} not found`);
          continue;
        }

        await this.storageFilesRepository.softDelete(
          new UniqueEntityID(fileId),
        );
        deletedFiles++;
      } catch (error) {
        errors.push(
          `Failed to delete file ${fileId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    // Delete folders (with cascade)
    for (const folderId of folderIds) {
      try {
        const folder = await this.storageFoldersRepository.findById(
          new UniqueEntityID(folderId),
          tenantId,
        );

        if (!folder) {
          errors.push(`Folder ${folderId} not found`);
          continue;
        }

        if (folder.isSystem) {
          errors.push(`System folder ${folder.name} cannot be deleted`);
          continue;
        }

        // Get all descendants
        const descendants = await this.storageFoldersRepository.findDescendants(
          new UniqueEntityID(folderId),
          tenantId,
        );

        const allFolderIds = [
          folderId,
          ...descendants.map((d) => d.id.toString()),
        ];

        // Batch soft-delete all files in affected folders
        const filesDeleted =
          await this.storageFilesRepository.softDeleteByFolderIds(
            allFolderIds,
            tenantId,
          );

        deletedFiles += filesDeleted;

        // Batch soft-delete all folders
        await this.storageFoldersRepository.batchSoftDelete(allFolderIds);
        deletedFolders += allFolderIds.length;
      } catch (error) {
        errors.push(
          `Failed to delete folder ${folderId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    return { deletedFiles, deletedFolders, errors };
  }
}
