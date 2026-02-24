import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { slugify } from '@/constants/storage/folder-templates';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';

interface CreateFolderUseCaseRequest {
  tenantId: string;
  name: string;
  parentId?: string;
  icon?: string;
  color?: string;
  createdBy?: string;
}

interface CreateFolderUseCaseResponse {
  folder: import('@/entities/storage/storage-folder').StorageFolder;
}

export class CreateFolderUseCase {
  constructor(private storageFoldersRepository: StorageFoldersRepository) {}

  async execute(
    request: CreateFolderUseCaseRequest,
  ): Promise<CreateFolderUseCaseResponse> {
    const { tenantId, name, parentId, icon, color, createdBy } = request;

    // Validate name
    if (!name || name.trim().length === 0) {
      throw new BadRequestError('Folder name is required');
    }

    if (name.length > 256) {
      throw new BadRequestError(
        'Folder name must be at most 256 characters long',
      );
    }

    const folderSlug = slugify(name);
    let folderPath: string;
    let folderDepth: number;

    if (parentId) {
      // Validate parent exists
      const parentFolder = await this.storageFoldersRepository.findById(
        new UniqueEntityID(parentId),
        tenantId,
      );

      if (!parentFolder) {
        throw new ResourceNotFoundError('Parent folder not found');
      }

      folderPath = parentFolder.buildChildPath(folderSlug);
      folderDepth = parentFolder.depth + 1;

      // Check for duplicate name in same parent
      const siblings = await this.storageFoldersRepository.findChildren(
        new UniqueEntityID(parentId),
        tenantId,
      );

      const duplicateSibling = siblings.find(
        (sibling) => sibling.name.toLowerCase() === name.trim().toLowerCase(),
      );

      if (duplicateSibling) {
        throw new BadRequestError(
          'A folder with this name already exists in the same parent',
        );
      }
    } else {
      folderPath = `/${folderSlug}`;
      folderDepth = 0;

      // Check for duplicate name at root level
      const rootFolders =
        await this.storageFoldersRepository.findRootFolders(tenantId);

      const duplicateRoot = rootFolders.find(
        (rootFolder) =>
          rootFolder.name.toLowerCase() === name.trim().toLowerCase(),
      );

      if (duplicateRoot) {
        throw new BadRequestError(
          'A folder with this name already exists at root level',
        );
      }
    }

    const createdFolder = await this.storageFoldersRepository.create({
      tenantId,
      name: name.trim(),
      slug: folderSlug,
      path: folderPath,
      parentId: parentId ?? null,
      depth: folderDepth,
      icon: icon ?? null,
      color: color ?? null,
      createdBy: createdBy ?? null,
    });

    return {
      folder: createdFolder,
    };
  }
}
