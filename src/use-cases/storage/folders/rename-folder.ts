import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { slugify } from '@/constants/storage/folder-templates';
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
  constructor(private storageFoldersRepository: StorageFoldersRepository) {}

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

    // Collect descendants BEFORE updating the folder path
    // (in-memory repos mutate objects by reference, so path-based lookups
    // must happen before the parent path changes)
    const descendants =
      oldPath !== newPath
        ? await this.storageFoldersRepository.findDescendants(
            new UniqueEntityID(folderId),
            tenantId,
          )
        : [];

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

    // Cascade path update to all descendants
    for (const descendant of descendants) {
      const descendantNewPath = descendant.path.replace(oldPath, newPath);

      await this.storageFoldersRepository.update({
        id: descendant.id,
        path: descendantNewPath,
      });
    }

    return {
      folder: updatedFolder,
    };
  }
}
