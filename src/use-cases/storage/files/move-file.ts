import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageFile } from '@/entities/storage/storage-file';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';
import type { FolderAccessService } from '@/services/storage/folder-access-service';

interface MoveFileUseCaseRequest {
  tenantId: string;
  fileId: string;
  targetFolderId: string | null;
  userId?: string;
  userGroupIds?: string[];
}

interface MoveFileUseCaseResponse {
  file: StorageFile;
}

export class MoveFileUseCase {
  constructor(
    private storageFilesRepository: StorageFilesRepository,
    private storageFoldersRepository: StorageFoldersRepository,
    private folderAccessService?: FolderAccessService,
  ) {}

  async execute(
    request: MoveFileUseCaseRequest,
  ): Promise<MoveFileUseCaseResponse> {
    const { tenantId, fileId, targetFolderId, userId, userGroupIds } = request;

    const file = await this.storageFilesRepository.findById(
      new UniqueEntityID(fileId),
      tenantId,
    );

    if (!file) {
      throw new ResourceNotFoundError('File not found');
    }

    // ACL check: verify write on source folder and target folder
    if (this.folderAccessService && userId) {
      if (file.folderId) {
        await this.folderAccessService.verifyAccess(
          file.folderId.toString(),
          userId,
          userGroupIds ?? [],
          'write',
        );
      }
      if (targetFolderId) {
        await this.folderAccessService.verifyAccess(
          targetFolderId,
          userId,
          userGroupIds ?? [],
          'write',
        );
      }
    }

    const newSlug = file.name.toLowerCase().trim().replace(/\s+/g, '-');
    let newPath: string;

    if (targetFolderId) {
      const targetFolder = await this.storageFoldersRepository.findById(
        new UniqueEntityID(targetFolderId),
        tenantId,
      );

      if (!targetFolder) {
        throw new ResourceNotFoundError('Target folder not found');
      }

      newPath = targetFolder.buildChildPath(newSlug);
    } else {
      // Move to root
      newPath = `/${newSlug}`;
    }

    // Check for name conflict at target path
    const existingFileAtPath = await this.storageFilesRepository.findByPath(
      newPath,
      tenantId,
    );

    if (existingFileAtPath && !existingFileAtPath.id.equals(file.id)) {
      throw new BadRequestError(
        'A file with the same name already exists in the target folder',
      );
    }

    const updatedFile = await this.storageFilesRepository.update({
      id: file.id,
      folderId: targetFolderId,
      path: newPath,
    });

    if (!updatedFile) {
      throw new ResourceNotFoundError('File not found');
    }

    return {
      file: updatedFile,
    };
  }
}
