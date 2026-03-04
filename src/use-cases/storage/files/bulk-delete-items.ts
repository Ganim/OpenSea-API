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

    // Batch pre-fetch all files and folders
    const filesMap = new Map<
      string,
      import('@/entities/storage/storage-file').StorageFile
    >();
    if (fileIds.length > 0) {
      const files = await this.storageFilesRepository.findByIds(
        fileIds,
        tenantId,
      );
      for (const file of files) {
        filesMap.set(file.id.toString(), file);
      }
    }

    const foldersMap = new Map<
      string,
      import('@/entities/storage/storage-folder').StorageFolder
    >();
    if (folderIds.length > 0) {
      const folders = await this.storageFoldersRepository.findByIds(
        folderIds,
        tenantId,
      );
      for (const folder of folders) {
        foldersMap.set(folder.id.toString(), folder);
      }
    }

    // Delete individual files
    for (const fileId of fileIds) {
      try {
        const file = filesMap.get(fileId);

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
        const folder = foldersMap.get(folderId);

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
