import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { slugify } from '@/constants/storage/folder-templates';
import type { StorageFolder } from '@/entities/storage/storage-folder';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';

interface RenameEntityFoldersUseCaseRequest {
  tenantId: string;
  entityType: string;
  entityId: string;
  newName: string;
}

interface RenameEntityFoldersUseCaseResponse {
  folder: StorageFolder;
  renamedDescendantsCount: number;
}

export class RenameEntityFoldersUseCase {
  constructor(private storageFoldersRepository: StorageFoldersRepository) {}

  async execute(
    request: RenameEntityFoldersUseCaseRequest,
  ): Promise<RenameEntityFoldersUseCaseResponse> {
    const { tenantId, entityType, entityId, newName } = request;

    const entityFolder = await this.storageFoldersRepository.findByEntityId(
      entityType,
      entityId,
      tenantId,
    );

    if (!entityFolder) {
      throw new ResourceNotFoundError(
        `Folder not found for ${entityType} with id: ${entityId}`,
      );
    }

    const oldPath = entityFolder.path;
    const newSlug = slugify(newName);

    // Build the new path by replacing the last segment
    const pathSegments = oldPath.split('/');
    pathSegments[pathSegments.length - 1] = newSlug;
    const newPath = pathSegments.join('/');

    // Fetch descendants BEFORE updating the entity folder path,
    // because findDescendants relies on the current path prefix to match children
    const descendants = await this.storageFoldersRepository.findDescendants(
      entityFolder.id,
      tenantId,
    );

    // Update the entity folder itself
    const updatedEntityFolder = await this.storageFoldersRepository.update({
      id: entityFolder.id,
      name: newName,
      slug: newSlug,
      path: newPath,
    });

    let renamedDescendantsCount = 0;

    for (const descendant of descendants) {
      const descendantNewPath = descendant.path.replace(oldPath, newPath);

      await this.storageFoldersRepository.update({
        id: descendant.id,
        path: descendantNewPath,
      });

      renamedDescendantsCount++;
    }

    return {
      folder: updatedEntityFolder!,
      renamedDescendantsCount,
    };
  }
}
