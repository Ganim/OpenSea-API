import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TransactionManager } from '@/lib/transaction-manager';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';

interface MoveFolderUseCaseRequest {
  tenantId: string;
  folderId: string;
  targetParentId: string | null;
}

interface MoveFolderUseCaseResponse {
  folder: import('@/entities/storage/storage-folder').StorageFolder;
}

export class MoveFolderUseCase {
  constructor(
    private storageFoldersRepository: StorageFoldersRepository,
    private storageFilesRepository: StorageFilesRepository,
    private transactionManager?: TransactionManager,
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

    // Prevent moving into itself
    if (targetParentId && folderId === targetParentId) {
      throw new BadRequestError('Cannot move a folder into itself');
    }

    let newPath: string;
    let newDepth: number;

    if (targetParentId) {
      // Validate target parent exists
      const targetParent = await this.storageFoldersRepository.findById(
        new UniqueEntityID(targetParentId),
        tenantId,
      );

      if (!targetParent) {
        throw new ResourceNotFoundError('Target parent folder not found');
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

      newPath = targetParent.buildChildPath(folder.slug);
      newDepth = targetParent.depth + 1;
    } else {
      // Move to root
      const rootFolders =
        await this.storageFoldersRepository.findRootFolders(tenantId);

      const nameConflict = rootFolders.find(
        (sibling) =>
          sibling.name.toLowerCase() === folder.name.toLowerCase() &&
          !sibling.id.equals(folder.id),
      );

      if (nameConflict) {
        throw new BadRequestError(
          'A folder with this name already exists at the root level',
        );
      }

      newPath = `/${folder.slug}`;
      newDepth = 0;
    }

    // Calculate new path and depth
    const oldPath = folder.path;
    const oldDepth = folder.depth;

    // Wrap all mutations in a transaction to prevent partial path cascades
    const doMove = async () => {
      // Update folder (unique constraint on [tenantId, path, deletedAt] prevents race conditions)
      let updatedFolder;
      try {
        updatedFolder = await this.storageFoldersRepository.update({
          id: new UniqueEntityID(folderId),
          parentId: targetParentId,
          path: newPath,
          depth: newDepth,
        });
      } catch (error: unknown) {
        // Prisma unique constraint violation (P2002) — another request created a folder with the same path
        if (
          error &&
          typeof error === 'object' &&
          'code' in error &&
          error.code === 'P2002'
        ) {
          throw new BadRequestError(
            'A folder with this name already exists in the target folder',
          );
        }
        throw error;
      }

      if (!updatedFolder) {
        throw new ResourceNotFoundError('Folder not found');
      }

      // Batch cascade path, depth, and file path updates
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

      return { folder: updatedFolder };
    };

    if (this.transactionManager) {
      return this.transactionManager.run(() => doMove());
    }
    return doMove();
  }
}
