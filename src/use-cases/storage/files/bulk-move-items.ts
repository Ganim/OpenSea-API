import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TransactionManager } from '@/lib/transaction-manager';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';

interface BulkMoveItemsUseCaseRequest {
  tenantId: string;
  fileIds?: string[];
  folderIds?: string[];
  targetFolderId: string | null;
}

interface BulkMoveItemsUseCaseResponse {
  movedFiles: number;
  movedFolders: number;
  errors: string[];
}

export class BulkMoveItemsUseCase {
  constructor(
    private storageFilesRepository: StorageFilesRepository,
    private storageFoldersRepository: StorageFoldersRepository,
    private transactionManager?: TransactionManager,
  ) {}

  async execute(
    request: BulkMoveItemsUseCaseRequest,
  ): Promise<BulkMoveItemsUseCaseResponse> {
    const { tenantId, fileIds = [], folderIds = [], targetFolderId } = request;

    if (fileIds.length === 0 && folderIds.length === 0) {
      throw new BadRequestError('No items provided for move');
    }

    // Validate target folder exists (if not moving to root)
    let targetFolder:
      | import('@/entities/storage/storage-folder').StorageFolder
      | null = null;

    if (targetFolderId) {
      targetFolder = await this.storageFoldersRepository.findById(
        new UniqueEntityID(targetFolderId),
        tenantId,
      );

      if (!targetFolder) {
        throw new ResourceNotFoundError('Target folder not found');
      }
    }

    // Wrap all mutations in a transaction to prevent partial moves
    const doMove = async () => {
      return this.performMove(tenantId, fileIds, folderIds, targetFolder);
    };

    if (this.transactionManager) {
      return this.transactionManager.run(() => doMove());
    }
    return doMove();
  }

  private async performMove(
    tenantId: string,
    fileIds: string[],
    folderIds: string[],
    targetFolder: import('@/entities/storage/storage-folder').StorageFolder | null,
  ): Promise<BulkMoveItemsUseCaseResponse> {
    const targetFolderId = targetFolder?.id.toString() ?? null;
    let movedFiles = 0;
    let movedFolders = 0;
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

    // Move files
    for (const fileId of fileIds) {
      try {
        const file = filesMap.get(fileId);

        if (!file) {
          errors.push(`File ${fileId} not found`);
          continue;
        }

        const newSlug = file.name.toLowerCase().trim().replace(/\s+/g, '-');
        const newPath = targetFolder
          ? targetFolder.buildChildPath(newSlug)
          : `/${newSlug}`;

        await this.storageFilesRepository.update({
          id: file.id,
          folderId: targetFolderId,
          path: newPath,
        });

        movedFiles++;
      } catch (error) {
        errors.push(
          `Failed to move file ${fileId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    // Move folders
    for (const folderId of folderIds) {
      try {
        // Cannot move a folder into itself
        if (targetFolderId && folderId === targetFolderId) {
          errors.push(`Cannot move folder ${folderId} into itself`);
          continue;
        }

        const folder = foldersMap.get(folderId);

        if (!folder) {
          errors.push(`Folder ${folderId} not found`);
          continue;
        }

        if (folder.isSystem) {
          errors.push(`System folder ${folder.name} cannot be moved`);
          continue;
        }

        // Check for circular reference (only when moving into a folder)
        if (targetFolderId) {
          const descendants =
            await this.storageFoldersRepository.findDescendants(
              new UniqueEntityID(folderId),
              tenantId,
            );

          const isDescendant = descendants.some((d) =>
            d.id.equals(new UniqueEntityID(targetFolderId)),
          );

          if (isDescendant) {
            errors.push(
              `Cannot move folder ${folder.name} into one of its descendants`,
            );
            continue;
          }
        }

        const oldPath = folder.path;
        const newPath = targetFolder
          ? targetFolder.buildChildPath(folder.slug)
          : `/${folder.slug}`;
        const oldDepth = folder.depth;
        const newDepth = targetFolder ? targetFolder.depth + 1 : 0;

        // Update folder
        await this.storageFoldersRepository.update({
          id: new UniqueEntityID(folderId),
          parentId: targetFolderId,
          path: newPath,
          depth: newDepth,
        });

        // Batch cascade to descendants and files
        if (oldPath !== newPath) {
          const depthDifference = newDepth - oldDepth;

          await this.storageFoldersRepository.batchUpdatePaths(
            oldPath,
            newPath,
            tenantId,
          );

          if (depthDifference !== 0) {
            await this.storageFoldersRepository.batchUpdateDepths(
              newPath,
              depthDifference,
              tenantId,
            );
          }

          await this.storageFilesRepository.batchUpdateFilePaths(
            oldPath,
            newPath,
            tenantId,
          );
        }

        movedFolders++;
      } catch (error) {
        errors.push(
          `Failed to move folder ${folderId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    return { movedFiles, movedFolders, errors };
  }
}
