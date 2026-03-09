import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageFile } from '@/entities/storage/storage-file';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { StorageFileVersionsRepository } from '@/repositories/storage/storage-file-versions-repository';
import type { FileUploadService } from '@/services/storage/file-upload-service';
import type { FolderAccessService } from '@/services/storage/folder-access-service';

interface DownloadFileUseCaseRequest {
  tenantId: string;
  fileId: string;
  userId?: string;
  userGroupIds?: string[];
  version?: number;
}

interface DownloadFileUseCaseResponse {
  url: string;
  file: StorageFile;
}

export class DownloadFileUseCase {
  constructor(
    private storageFilesRepository: StorageFilesRepository,
    private storageFileVersionsRepository: StorageFileVersionsRepository,
    private fileUploadService: FileUploadService,
    private folderAccessService?: FolderAccessService,
  ) {}

  async execute(
    request: DownloadFileUseCaseRequest,
  ): Promise<DownloadFileUseCaseResponse> {
    const { tenantId, fileId, userId, userGroupIds, version } = request;

    const file = await this.storageFilesRepository.findById(
      new UniqueEntityID(fileId),
      tenantId,
    );

    if (!file) {
      throw new ResourceNotFoundError('File not found');
    }

    if (!file.isAccessible) {
      throw new ForbiddenError('File is not accessible');
    }

    // ACL check: verify read permission on file's folder
    if (this.folderAccessService && file.folderId && userId) {
      await this.folderAccessService.verifyAccess(
        file.folderId.toString(),
        userId,
        userGroupIds ?? [],
        'read',
      );
    }

    let fileKeyToDownload = file.fileKey;

    if (version !== undefined) {
      const requestedVersion =
        await this.storageFileVersionsRepository.findByVersion(
          new UniqueEntityID(fileId),
          version,
          tenantId,
        );

      if (!requestedVersion) {
        throw new ResourceNotFoundError(`File version ${version} not found`);
      }

      fileKeyToDownload = requestedVersion.fileKey;
    }

    const presignedUrl =
      await this.fileUploadService.getPresignedUrl(fileKeyToDownload);

    return {
      url: presignedUrl,
      file,
    };
  }
}
