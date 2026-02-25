import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';

interface BulkMoveItemsUseCaseRequest {
  tenantId: string;
  fileIds?: string[];
  folderIds?: string[];
  targetFolderId: string;
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
  ) {}

  async execute(
    request: BulkMoveItemsUseCaseRequest,
  ): Promise<BulkMoveItemsUseCaseResponse> {
    const { tenantId, fileIds = [], folderIds = [], targetFolderId } = request;

    if (fileIds.length === 0 && folderIds.length === 0) {
      throw new BadRequestError('No items provided for move');
    }

    // Validate target folder exists
    const targetFolder = await this.storageFoldersRepository.findById(
      new UniqueEntityID(targetFolderId),
      tenantId,
    );

    if (!targetFolder) {
      throw new ResourceNotFoundError('Target folder not found');
    }

    let movedFiles = 0;
    let movedFolders = 0;
    const errors: string[] = [];

    // Move files
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

        const newSlug = file.name.toLowerCase().trim().replace(/\s+/g, '-');
        const newPath = targetFolder.buildChildPath(newSlug);

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
        if (folderId === targetFolderId) {
          errors.push(`Cannot move folder ${folderId} into itself`);
          continue;
        }

        const folder = await this.storageFoldersRepository.findById(
          new UniqueEntityID(folderId),
          tenantId,
        );

        if (!folder) {
          errors.push(`Folder ${folderId} not found`);
          continue;
        }

        if (folder.isSystem) {
          errors.push(`System folder ${folder.name} cannot be moved`);
          continue;
        }

        // Check for circular reference
        const descendants = await this.storageFoldersRepository.findDescendants(
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

        const oldPath = folder.path;
        const newPath = targetFolder.buildChildPath(folder.slug);
        const oldDepth = folder.depth;
        const newDepth = targetFolder.depth + 1;

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
