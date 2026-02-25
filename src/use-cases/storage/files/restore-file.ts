import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageFile } from '@/entities/storage/storage-file';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';

interface RestoreFileUseCaseRequest {
  tenantId: string;
  fileId: string;
}

interface RestoreFileUseCaseResponse {
  file: StorageFile;
}

export class RestoreFileUseCase {
  constructor(
    private storageFilesRepository: StorageFilesRepository,
    private storageFoldersRepository: StorageFoldersRepository,
  ) {}

  async execute(
    request: RestoreFileUseCaseRequest,
  ): Promise<RestoreFileUseCaseResponse> {
    const { tenantId, fileId } = request;

    const file = await this.storageFilesRepository.findDeletedById(
      new UniqueEntityID(fileId),
      tenantId,
    );

    if (!file) {
      throw new ResourceNotFoundError('File not found');
    }

    // Restore the file
    await this.storageFilesRepository.restore(new UniqueEntityID(fileId));

    // Check if the parent folder still exists (is not deleted)
    if (file.folderId) {
      const parentFolder = await this.storageFoldersRepository.findById(
        file.folderId,
        tenantId,
      );

      // If parent folder is deleted or doesn't exist, move file to root
      if (!parentFolder) {
        const slug = file.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        await this.storageFilesRepository.update({
          id: file.id,
          folderId: null,
          path: `/${slug}`,
        });

        file.folderId = null;
        file.path = `/${slug}`;
      }
    }

    return { file };
  }
}
