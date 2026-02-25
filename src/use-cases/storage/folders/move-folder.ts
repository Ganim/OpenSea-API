import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';

interface MoveFolderUseCaseRequest {
  tenantId: string;
  folderId: string;
  targetParentId: string;
}

interface MoveFolderUseCaseResponse {
  folder: import('@/entities/storage/storage-folder').StorageFolder;
}

export class MoveFolderUseCase {
  constructor(
    private storageFoldersRepository: StorageFoldersRepository,
    private storageFilesRepository: StorageFilesRepository,
  ) {}

  async execute(
    request: MoveFolderUseCaseRequest,
  ): Promise<MoveFolderUseCaseResponse> {
    const { tenantId, folderId, targetParentId } = request;

    // Validate folder exists
    const folder = await this.storageFoldersRepository.findById(
      new UniqueEntityID(folderId),
      tenantId,
    );

    if (!folder) {
      throw new ResourceNotFoundError('Folder not found');
    }

    // Validate target parent exists
    const targetParent = await this.storageFoldersRepository.findById(
      new UniqueEntityID(targetParentId),
      tenantId,
    );

    if (!targetParent) {
      throw new ResourceNotFoundError('Target parent folder not found');
    }

    // Prevent moving into itself
    if (folderId === targetParentId) {
      throw new BadRequestError('Cannot move a folder into itself');
    }

    // Prevent moving into a descendant (circular reference)
    const descendants = await this.storageFoldersRepository.findDescendants(
      new UniqueEntityID(folderId),
      tenantId,
    );

    const isDescendant = descendants.some((descendant) =>
      descendant.id.equals(new UniqueEntityID(targetParentId)),
    );

    if (isDescendant) {
      throw new BadRequestError(
        'Cannot move a folder into one of its descendants',
      );
    }

    // Check for name conflict in target parent
    const targetSiblings = await this.storageFoldersRepository.findChildren(
      new UniqueEntityID(targetParentId),
      tenantId,
    );

    const nameConflict = targetSiblings.find(
      (sibling) =>
        sibling.name.toLowerCase() === folder.name.toLowerCase() &&
        !sibling.id.equals(folder.id),
    );

    if (nameConflict) {
      throw new BadRequestError(
        'A folder with this name already exists in the target folder',
      );
    }

    // Calculate new path and depth
    const oldPath = folder.path;
    const oldDepth = folder.depth;
    const newPath = targetParent.buildChildPath(folder.slug);
    const newDepth = targetParent.depth + 1;

    // Update folder
    const updatedFolder = await this.storageFoldersRepository.update({
      id: new UniqueEntityID(folderId),
      parentId: targetParentId,
      path: newPath,
      depth: newDepth,
    });

    if (!updatedFolder) {
      throw new ResourceNotFoundError('Folder not found');
    }

    // Batch cascade path, depth, and file path updates
    if (oldPath !== newPath) {
      const depthDifference = newDepth - oldDepth;

      // Batch update descendant folder paths (old prefix → new prefix)
      await this.storageFoldersRepository.batchUpdatePaths(
        oldPath,
        newPath,
        tenantId,
      );

      // Batch update descendant folder depths (after paths are already updated)
      if (depthDifference !== 0) {
        await this.storageFoldersRepository.batchUpdateDepths(
          newPath,
          depthDifference,
          tenantId,
        );
      }

      // Batch update file paths in all affected folders
      await this.storageFilesRepository.batchUpdateFilePaths(
        oldPath,
        newPath,
        tenantId,
      );
    }

    return {
      folder: updatedFolder,
    };
  }
}
