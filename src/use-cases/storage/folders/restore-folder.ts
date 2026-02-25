import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageFolder } from '@/entities/storage/storage-folder';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';

interface RestoreFolderUseCaseRequest {
  tenantId: string;
  folderId: string;
}

interface RestoreFolderUseCaseResponse {
  folder: StorageFolder;
}

export class RestoreFolderUseCase {
  constructor(
    private storageFoldersRepository: StorageFoldersRepository,
    private storageFilesRepository: StorageFilesRepository,
  ) {}

  async execute(
    request: RestoreFolderUseCaseRequest,
  ): Promise<RestoreFolderUseCaseResponse> {
    const { tenantId, folderId } = request;

    const folder = await this.storageFoldersRepository.findDeletedById(
      new UniqueEntityID(folderId),
      tenantId,
    );

    if (!folder) {
      throw new ResourceNotFoundError('Folder not found');
    }

    // Capture the folder's path before restoring to find deleted descendants
    const folderPath = folder.path;
    const pathPrefix = folderPath === '/' ? '/' : `${folderPath}/`;

    // Find all deleted folders for this tenant to identify descendants by path
    const { folders: allDeletedFolders } =
      await this.storageFoldersRepository.findDeleted(tenantId, 1, 10000);

    const descendantIds = allDeletedFolders
      .filter(
        (f) =>
          !f.id.equals(new UniqueEntityID(folderId)) &&
          f.path.startsWith(pathPrefix),
      )
      .map((f) => f.id.toString());

    // Restore the folder itself
    await this.storageFoldersRepository.restore(new UniqueEntityID(folderId));

    // Batch restore descendant folders
    if (descendantIds.length > 0) {
      await this.storageFoldersRepository.batchRestore(descendantIds);
    }

    // Restore files in this folder and all descendant folders
    const allFolderIds = [folderId, ...descendantIds];
    await this.storageFilesRepository.restoreByFolderIds(
      allFolderIds,
      tenantId,
    );

    // Check if the parent folder still exists (is not deleted)
    if (folder.parentId) {
      const parentFolder = await this.storageFoldersRepository.findById(
        folder.parentId,
        tenantId,
      );

      // If parent folder is deleted or doesn't exist, move to root
      if (!parentFolder) {
        await this.storageFoldersRepository.update({
          id: folder.id,
          parentId: null,
          path: `/${folder.slug}`,
          depth: 0,
        });

        folder.parentId = null;
        folder.path = `/${folder.slug}`;
        folder.depth = 0;
      }
    }

    return { folder };
  }
}
