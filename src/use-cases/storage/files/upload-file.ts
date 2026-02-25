import { PlanLimitExceededError } from '@/@errors/use-cases/plan-limit-exceeded-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FileType } from '@/entities/storage';
import type { StorageFile } from '@/entities/storage/storage-file';
import type { StorageFileVersion } from '@/entities/storage/storage-file-version';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { StorageFileVersionsRepository } from '@/repositories/storage/storage-file-versions-repository';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';
import type { FileUploadService } from '@/services/storage/file-upload-service';
import type { ThumbnailService } from '@/services/storage/thumbnail-service';

interface UploadFileUseCaseRequest {
  tenantId: string;
  folderId: string;
  file: {
    buffer: Buffer;
    filename: string;
    mimetype: string;
  };
  entityType?: string;
  entityId?: string;
  uploadedBy: string;
  maxStorageBytes?: number; // 0 or undefined = unlimited
}

interface UploadFileUseCaseResponse {
  file: StorageFile;
  version: StorageFileVersion;
}

export class UploadFileUseCase {
  constructor(
    private storageFoldersRepository: StorageFoldersRepository,
    private storageFilesRepository: StorageFilesRepository,
    private storageFileVersionsRepository: StorageFileVersionsRepository,
    private fileUploadService: FileUploadService,
    private thumbnailService?: ThumbnailService,
  ) {}

  async execute(
    request: UploadFileUseCaseRequest,
  ): Promise<UploadFileUseCaseResponse> {
    const {
      tenantId,
      folderId,
      file,
      entityType,
      entityId,
      uploadedBy,
      maxStorageBytes,
    } = request;

    const folder = await this.storageFoldersRepository.findById(
      new UniqueEntityID(folderId),
      tenantId,
    );

    if (!folder) {
      throw new ResourceNotFoundError('Folder not found');
    }

    // Check storage quota if a limit is set
    if (maxStorageBytes && maxStorageBytes > 0) {
      const currentUsage =
        await this.storageFilesRepository.getTotalSize(tenantId);
      const newTotal = currentUsage + file.buffer.length;

      if (newTotal > maxStorageBytes) {
        const limitMb = Math.round(maxStorageBytes / 1024 / 1024);
        throw new PlanLimitExceededError('MB de armazenamento', limitMb);
      }
    }

    const fileType = FileType.fromMimeType(file.mimetype);

    const uploadPrefix = `storage/${tenantId}/${folderId}`;
    const uploadResult = await this.fileUploadService.upload(
      file.buffer,
      file.filename,
      file.mimetype,
      { prefix: uploadPrefix },
    );

    const filePath = folder.buildChildPath(file.filename);

    const createdFile = await this.storageFilesRepository.create({
      tenantId,
      folderId,
      name: file.filename,
      originalName: file.filename,
      fileKey: uploadResult.key,
      path: filePath,
      size: uploadResult.size,
      mimeType: file.mimetype,
      fileType: fileType.value,
      entityType: entityType ?? null,
      entityId: entityId ?? null,
      uploadedBy,
    });

    const initialVersion = await this.storageFileVersionsRepository.create({
      fileId: createdFile.id.toString(),
      version: 1,
      fileKey: uploadResult.key,
      size: uploadResult.size,
      mimeType: file.mimetype,
      changeNote: 'Initial upload',
      uploadedBy,
    });

    // Generate thumbnail if possible (best-effort, never blocks the upload)
    if (this.thumbnailService?.canGenerate(file.mimetype)) {
      try {
        const thumbnail = await this.thumbnailService.generate(
          file.buffer,
          file.mimetype,
        );

        if (thumbnail) {
          const thumbResult = await this.fileUploadService.upload(
            thumbnail.buffer,
            `thumb_${file.filename}`,
            thumbnail.mimeType,
            { prefix: `${uploadPrefix}/thumbnails` },
          );

          await this.storageFilesRepository.update({
            id: createdFile.id,
            thumbnailKey: thumbResult.key,
          });
        }
      } catch {
        // Thumbnail generation failure should not block the upload
      }
    }

    return {
      file: createdFile,
      version: initialVersion,
    };
  }
}
