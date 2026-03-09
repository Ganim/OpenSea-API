import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { isAllowedMimeType } from '@/constants/storage/allowed-mime-types';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageFile } from '@/entities/storage/storage-file';
import type { StorageFileVersion } from '@/entities/storage/storage-file-version';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { StorageFileVersionsRepository } from '@/repositories/storage/storage-file-versions-repository';
import type { FileUploadService } from '@/services/storage/file-upload-service';
import type { EncryptionService } from '@/services/storage/encryption-service';

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
    private encryptionService?: EncryptionService,
  ) {}

  async execute(
    request: UploadFileVersionUseCaseRequest,
  ): Promise<UploadFileVersionUseCaseResponse> {
    const { tenantId, fileId, file, changeNote, uploadedBy } = request;

    // Validate MIME type
    if (!isAllowedMimeType(file.mimetype)) {
      throw new BadRequestError(
        `Tipo de arquivo não permitido: ${file.mimetype}`,
      );
    }

    const existingFile = await this.storageFilesRepository.findById(
      new UniqueEntityID(fileId),
      tenantId,
    );

    if (!existingFile) {
      throw new ResourceNotFoundError('File not found');
    }

    // Encrypt file buffer if encryption key is configured
    let uploadBuffer = file.buffer;
    let isEncrypted = false;

    if (this.encryptionService) {
      uploadBuffer = this.encryptionService.encrypt(file.buffer);
      isEncrypted = true;
    }

    const uploadPrefix = `storage/${tenantId}/${existingFile.folderId?.toString() ?? 'root'}`;
    const uploadResult = await this.fileUploadService.upload(
      uploadBuffer,
      file.filename,
      file.mimetype,
      { prefix: uploadPrefix },
    );

    const nextVersionNumber = existingFile.currentVersion + 1;

    const newVersion = await this.storageFileVersionsRepository.create({
      fileId: existingFile.id.toString(),
      version: nextVersionNumber,
      fileKey: uploadResult.key,
      size: file.buffer.length, // Store original (unencrypted) size
      mimeType: file.mimetype,
      changeNote: changeNote ?? null,
      uploadedBy,
    });

    const updatedFile = await this.storageFilesRepository.update({
      id: existingFile.id,
      currentVersion: nextVersionNumber,
      fileKey: uploadResult.key,
      size: file.buffer.length, // Store original (unencrypted) size
      mimeType: file.mimetype,
      isEncrypted,
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
