import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageFile } from '@/entities/storage/storage-file';
import type { StorageFileVersion } from '@/entities/storage/storage-file-version';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { StorageFileVersionsRepository } from '@/repositories/storage/storage-file-versions-repository';
import type { FileUploadService } from '@/services/storage/file-upload-service';

interface UploadFileVersionUseCaseRequest {
  tenantId: string;
  fileId: string;
  file: {
    buffer: Buffer;
    filename: string;
    mimetype: string;
  };
  changeNote?: string;
  uploadedBy: string;
}

interface UploadFileVersionUseCaseResponse {
  file: StorageFile;
  version: StorageFileVersion;
}

export class UploadFileVersionUseCase {
  constructor(
    private storageFilesRepository: StorageFilesRepository,
    private storageFileVersionsRepository: StorageFileVersionsRepository,
    private fileUploadService: FileUploadService,
  ) {}

  async execute(
    request: UploadFileVersionUseCaseRequest,
  ): Promise<UploadFileVersionUseCaseResponse> {
    const { tenantId, fileId, file, changeNote, uploadedBy } = request;

    const existingFile = await this.storageFilesRepository.findById(
      new UniqueEntityID(fileId),
      tenantId,
    );

    if (!existingFile) {
      throw new ResourceNotFoundError('File not found');
    }

    const uploadPrefix = `storage/${tenantId}/${existingFile.folderId.toString()}`;
    const uploadResult = await this.fileUploadService.upload(
      file.buffer,
      file.filename,
      file.mimetype,
      { prefix: uploadPrefix },
    );

    const nextVersionNumber = existingFile.currentVersion + 1;

    const newVersion = await this.storageFileVersionsRepository.create({
      fileId: existingFile.id.toString(),
      version: nextVersionNumber,
      fileKey: uploadResult.key,
      size: uploadResult.size,
      mimeType: file.mimetype,
      changeNote: changeNote ?? null,
      uploadedBy,
    });

    const updatedFile = await this.storageFilesRepository.update({
      id: existingFile.id,
      currentVersion: nextVersionNumber,
      fileKey: uploadResult.key,
      size: uploadResult.size,
      mimeType: file.mimetype,
    });

    if (!updatedFile) {
      throw new ResourceNotFoundError('File not found');
    }

    return {
      file: updatedFile,
      version: newVersion,
    };
  }
}
