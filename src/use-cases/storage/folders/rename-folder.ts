import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { slugify } from '@/constants/storage/folder-templates';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';

interface RenameFolderUseCaseRequest {
  tenantId: string;
  folderId: string;
  name: string;
}

interface RenameFolderUseCaseResponse {
  folder: import('@/entities/storage/storage-folder').StorageFolder;
}

export class RenameFolderUseCase {
  constructor(
    private storageFoldersRepository: StorageFoldersRepository,
    private storageFilesRepository: StorageFilesRepository,
  ) {}

  async execute(
    request: RenameFolderUseCaseRequest,
  ): Promise<RenameFolderUseCaseResponse> {
    const { tenantId, folderId, name } = request;

    // Validate name
    if (!name || name.trim().length === 0) {
      throw new BadRequestError('Folder name is required');
    }

    if (name.length > 256) {
      throw new BadRequestError(
        'Folder name must be at most 256 characters long',
      );
    }

    // Validate folder exists
    const folder = await this.storageFoldersRepository.findById(
      new UniqueEntityID(folderId),
      tenantId,
    );

    if (!folder) {
      throw new ResourceNotFoundError('Folder not found');
    }

    // System folders cannot be renamed
    if (folder.isSystem) {
      throw new BadRequestError('System folders cannot be renamed');
    }

    const trimmedName = name.trim();

    // Check for duplicate name in same parent
    if (folder.parentId) {
      const siblings = await this.storageFoldersRepository.findChildren(
        folder.parentId,
        tenantId,
      );

      const duplicateSibling = siblings.find(
        (sibling) =>
          sibling.name.toLowerCase() === trimmedName.toLowerCase() &&
          !sibling.id.equals(folder.id),
      );

      if (duplicateSibling) {
        throw new BadRequestError(
          'A folder with this name already exists in the same parent',
        );
      }
    } else {
      const rootFolders =
        await this.storageFoldersRepository.findRootFolders(tenantId);

      const duplicateRoot = rootFolders.find(
        (rootFolder) =>
          rootFolder.name.toLowerCase() === trimmedName.toLowerCase() &&
          !rootFolder.id.equals(folder.id),
      );

      if (duplicateRoot) {
        throw new BadRequestError(
          'A folder with this name already exists at root level',
        );
      }
    }

    const newSlug = slugify(trimmedName);
    const oldPath = folder.path;

    // Build new path
    let newPath: string;
    if (folder.parentId) {
      const parentFolder = await this.storageFoldersRepository.findById(
        folder.parentId,
        tenantId,
      );
      newPath = parentFolder
        ? parentFolder.buildChildPath(newSlug)
        : `/${newSlug}`;
    } else {
      newPath = `/${newSlug}`;
    }

    // Update folder name, slug, and path
    const updatedFolder = await this.storageFoldersRepository.update({
      id: new UniqueEntityID(folderId),
      name: trimmedName,
      slug: newSlug,
      path: newPath,
    });

    if (!updatedFolder) {
      throw new ResourceNotFoundError('Folder not found');
    }

    // Batch cascade path updates to all descendant folders and files
    if (oldPath !== newPath) {
      await this.storageFoldersRepository.batchUpdatePaths(
        oldPath,
        newPath,
        tenantId,
      );
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
