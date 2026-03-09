import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { FolderAccessService } from '@/services/storage/folder-access-service';

interface DeleteFileUseCaseRequest {
  tenantId: string;
  fileId: string;
  userId?: string;
  userGroupIds?: string[];
}

export class DeleteFileUseCase {
  constructor(
    private storageFilesRepository: StorageFilesRepository,
    private folderAccessService?: FolderAccessService,
  ) {}

  async execute(request: DeleteFileUseCaseRequest): Promise<void> {
    const { tenantId, fileId, userId, userGroupIds } = request;

    const file = await this.storageFilesRepository.findById(
      new UniqueEntityID(fileId),
      tenantId,
    );

    if (!file) {
      throw new ResourceNotFoundError('File not found');
    }

    // ACL check: verify delete permission on file's folder
    if (this.folderAccessService && file.folderId && userId) {
      await this.folderAccessService.verifyAccess(
        file.folderId.toString(),
        userId,
        userGroupIds ?? [],
        'delete',
      );
    }

    await this.storageFilesRepository.softDelete(new UniqueEntityID(fileId));
  }
}
