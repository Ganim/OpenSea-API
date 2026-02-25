import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageFile } from '@/entities/storage/storage-file';
import type { StorageFileVersion } from '@/entities/storage/storage-file-version';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { StorageFileVersionsRepository } from '@/repositories/storage/storage-file-versions-repository';

interface RestoreFileVersionUseCaseRequest {
  tenantId: string;
  fileId: string;
  versionId: string;
}

interface RestoreFileVersionUseCaseResponse {
  file: StorageFile;
  version: StorageFileVersion;
}

export class RestoreFileVersionUseCase {
  constructor(
    private storageFilesRepository: StorageFilesRepository,
    private storageFileVersionsRepository: StorageFileVersionsRepository,
  ) {}

  async execute(
    request: RestoreFileVersionUseCaseRequest,
  ): Promise<RestoreFileVersionUseCaseResponse> {
    const { tenantId, fileId, versionId } = request;

    const file = await this.storageFilesRepository.findById(
      new UniqueEntityID(fileId),
      tenantId,
    );

    if (!file) {
      throw new ResourceNotFoundError('File not found');
    }

    const allVersions = await this.storageFileVersionsRepository.findByFileId(
      new UniqueEntityID(fileId),
      tenantId,
    );

    const targetVersion = allVersions.find((version) =>
      version.id.equals(new UniqueEntityID(versionId)),
    );

    if (!targetVersion) {
      throw new ResourceNotFoundError('File version not found');
    }

    const nextVersionNumber = file.currentVersion + 1;

    const restoredVersion = await this.storageFileVersionsRepository.create({
      fileId: file.id.toString(),
      version: nextVersionNumber,
      fileKey: targetVersion.fileKey,
      size: targetVersion.size,
      mimeType: targetVersion.mimeType,
      changeNote: `Restored from version ${targetVersion.version}`,
      uploadedBy: targetVersion.uploadedBy,
    });

    const updatedFile = await this.storageFilesRepository.update({
      id: file.id,
      currentVersion: nextVersionNumber,
      fileKey: targetVersion.fileKey,
      size: targetVersion.size,
      mimeType: targetVersion.mimeType,
    });

    if (!updatedFile) {
      throw new ResourceNotFoundError('File not found');
    }

    return {
      file: updatedFile,
      version: restoredVersion,
    };
  }
}
