import { env } from '@/@env';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';
import type { StorageFileVersionsRepository } from '@/repositories/storage/storage-file-versions-repository';
import type { FileUploadService } from '@/services/storage/file-upload-service';
import { EncryptionService } from '@/services/storage/encryption-service';
import type { OfficeConversionService } from '@/services/storage/office-conversion-service';
import { compare } from 'bcryptjs';

interface ServeFileUseCaseRequest {
  tenantId: string;
  fileId: string;
  version?: number;
  password?: string;
  /** When 'pdf', converts office documents to PDF before serving */
  format?: 'pdf';
}

interface ServeFileUseCaseResponse {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
  size: number;
}

export class ServeFileUseCase {
  constructor(
    private storageFilesRepository: StorageFilesRepository,
    private storageFoldersRepository: StorageFoldersRepository,
    private storageFileVersionsRepository: StorageFileVersionsRepository,
    private fileUploadService: FileUploadService,
    private officeConversionService?: OfficeConversionService,
  ) {}

  async execute(
    request: ServeFileUseCaseRequest,
  ): Promise<ServeFileUseCaseResponse> {
    const { tenantId, fileId, version, format } = request;

    const file = await this.storageFilesRepository.findById(
      new UniqueEntityID(fileId),
      tenantId,
    );

    if (!file) {
      throw new ResourceNotFoundError('File not found');
    }

    // Check protection: file-level or parent folder-level
    if (file.isProtected) {
      if (!request.password) {
        throw new BadRequestError('PROTECTED');
      }
      const valid = await compare(request.password, file.protectionHash!);
      if (!valid) {
        throw new BadRequestError('INVALID_PASSWORD');
      }
    } else if (file.folderId) {
      const folder = await this.storageFoldersRepository.findById(
        new UniqueEntityID(file.folderId.toString()),
        tenantId,
      );
      if (folder?.isProtected) {
        if (!request.password) {
          throw new BadRequestError('PROTECTED');
        }
        const valid = await compare(request.password, folder.protectionHash!);
        if (!valid) {
          throw new BadRequestError('INVALID_PASSWORD');
        }
      }
    }

    let fileKey = file.fileKey;

    if (version) {
      const requestedVersion =
        await this.storageFileVersionsRepository.findByVersion(
          new UniqueEntityID(fileId),
          version,
        );
      if (requestedVersion) {
        fileKey = requestedVersion.fileKey;
      }
    }

    let buffer = await this.fileUploadService.getObject(fileKey);

    // Decrypt if file is encrypted
    if (file.isEncrypted && env.STORAGE_ENCRYPTION_KEY) {
      const encryptionService = new EncryptionService(
        env.STORAGE_ENCRYPTION_KEY,
      );
      buffer = encryptionService.decrypt(buffer);
    }

    // Convert office documents to PDF when requested
    if (
      format === 'pdf' &&
      this.officeConversionService?.canConvert(file.mimeType)
    ) {
      buffer = await this.officeConversionService.convertToPdf(
        buffer,
        file.name,
      );

      return {
        buffer,
        mimeType: 'application/pdf',
        fileName: file.name.replace(/\.[^.]+$/, '.pdf'),
        size: buffer.length,
      };
    }

    return {
      buffer,
      mimeType: file.mimeType,
      fileName: file.name,
      size: buffer.length,
    };
  }
}
