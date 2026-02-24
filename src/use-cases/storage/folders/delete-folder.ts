import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';

interface DeleteFolderUseCaseRequest {
  tenantId: string;
  folderId: string;
}

export class DeleteFolderUseCase {
  constructor(
    private storageFoldersRepository: StorageFoldersRepository,
    private storageFilesRepository: StorageFilesRepository,
  ) {}

  async execute(request: DeleteFolderUseCaseRequest): Promise<void> {
    const { tenantId, folderId } = request;

    // Validate folder exists
    const folder = await this.storageFoldersRepository.findById(
      new UniqueEntityID(folderId),
      tenantId,
    );

    if (!folder) {
      throw new ResourceNotFoundError('Folder not found');
    }

    // System folders cannot be deleted
    if (folder.isSystem) {
      throw new BadRequestError('System folders cannot be deleted');
    }

    // Get all descendants to soft-delete them recursively
    const descendants = await this.storageFoldersRepository.findDescendants(
      new UniqueEntityID(folderId),
      tenantId,
    );

    // Collect all folder IDs to delete (including the folder itself)
    const folderIdsToDelete = [
      new UniqueEntityID(folderId),
      ...descendants.map((descendant) => descendant.id),
    ];

    // Soft-delete files in all affected folders
    for (const folderIdToDelete of folderIdsToDelete) {
      const filesResult = await this.storageFilesRepository.findMany({
        tenantId,
        folderId: folderIdToDelete.toString(),
      });

      for (const file of filesResult.files) {
        await this.storageFilesRepository.softDelete(file.id);
      }
    }

    // Soft-delete all descendant folders (deepest first)
    for (const descendant of descendants.reverse()) {
      await this.storageFoldersRepository.softDelete(descendant.id);
    }

    // Soft-delete the folder itself
    await this.storageFoldersRepository.softDelete(
      new UniqueEntityID(folderId),
    );
  }
}
