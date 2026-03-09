import archiver from 'archiver';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PlanLimitExceededError } from '@/@errors/use-cases/plan-limit-exceeded-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageFile } from '@/entities/storage/storage-file';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';
import type { FileUploadService } from '@/services/storage/file-upload-service';

interface CompressFilesUseCaseRequest {
  tenantId: string;
  fileIds: string[];
  folderIds: string[];
  targetFolderId?: string | null;
  userId: string;
  maxStorageBytes?: number; // 0 or undefined = unlimited
}

interface CompressFilesUseCaseResponse {
  file: StorageFile;
}

const MAX_ZIP_SIZE = 500 * 1024 * 1024; // 500MB

export class CompressFilesUseCase {
  constructor(
    private storageFilesRepository: StorageFilesRepository,
    private storageFoldersRepository: StorageFoldersRepository,
    private fileUploadService: FileUploadService,
  ) {}

  async execute(
    request: CompressFilesUseCaseRequest,
  ): Promise<CompressFilesUseCaseResponse> {
    const { tenantId, fileIds, folderIds, targetFolderId, userId } = request;

    if (fileIds.length === 0 && folderIds.length === 0) {
      throw new BadRequestError(
        'Selecione ao menos um arquivo ou pasta para compactar.',
      );
    }

    // Collect all files
    const allFiles: { buffer: Buffer; zipPath: string }[] = [];

    // Add individual files
    for (const fileId of fileIds) {
      const file = await this.storageFilesRepository.findById(
        new UniqueEntityID(fileId),
        tenantId,
      );
      if (!file) continue;

      const buffer = await this.fileUploadService.getObject(file.fileKey);
      allFiles.push({ buffer, zipPath: file.name });
    }

    // Add folder contents recursively
    for (const folderId of folderIds) {
      const folder = await this.storageFoldersRepository.findById(
        new UniqueEntityID(folderId),
        tenantId,
      );
      if (!folder) continue;

      const descendants = await this.storageFoldersRepository.findDescendants(
        new UniqueEntityID(folderId),
        tenantId,
      );

      const allFolderIds = [
        folderId,
        ...descendants.map((d) => d.id.toString()),
      ];
      const folderPathMap = new Map<string, string>();
      folderPathMap.set(folderId, folder.name);
      for (const desc of descendants) {
        const relativePath = desc.path
          .replace(folder.path, '')
          .replace(/^\//, '');
        folderPathMap.set(desc.id.toString(), `${folder.name}/${relativePath}`);
      }

      for (const id of allFolderIds) {
        const result = await this.storageFilesRepository.findMany({
          tenantId,
          folderId: id,
          limit: 1000,
        });

        for (const file of result.files) {
          const folderRelPath =
            folderPathMap.get(file.folderId?.toString() ?? '') ?? folder.name;
          const buffer = await this.fileUploadService.getObject(file.fileKey);
          allFiles.push({ buffer, zipPath: `${folderRelPath}/${file.name}` });
        }
      }
    }

    if (allFiles.length === 0) {
      throw new BadRequestError('Nenhum arquivo encontrado para compactar.');
    }

    // Check total size
    const totalSize = allFiles.reduce((sum, f) => sum + f.buffer.length, 0);
    if (totalSize > MAX_ZIP_SIZE) {
      throw new BadRequestError(
        `O tamanho total excede o limite de ${Math.round(MAX_ZIP_SIZE / 1024 / 1024)}MB.`,
      );
    }

    // Create ZIP
    const archive = archiver('zip', { zlib: { level: 6 } });
    const chunks: Buffer[] = [];
    archive.on('data', (chunk: Buffer) => chunks.push(chunk));

    for (const { buffer, zipPath } of allFiles) {
      archive.append(buffer, { name: zipPath });
    }

    await Promise.all([
      archive.finalize(),
      new Promise<void>((resolve, reject) => {
        archive.on('end', resolve);
        archive.on('error', reject);
      }),
    ]);

    const zipBuffer = Buffer.concat(chunks);
    const zipFileName = `compactado-${Date.now()}.zip`;

    // Check storage quota before uploading the ZIP
    if (request.maxStorageBytes && request.maxStorageBytes > 0) {
      const withinQuota = await this.storageFilesRepository.atomicCheckQuota(
        tenantId,
        zipBuffer.length,
        request.maxStorageBytes,
      );
      if (!withinQuota) {
        const limitMb = Math.round(request.maxStorageBytes / 1024 / 1024);
        throw new PlanLimitExceededError('MB de armazenamento', limitMb);
      }
    }

    // Upload ZIP to S3
    const uploadResult = await this.fileUploadService.upload(
      zipBuffer,
      zipFileName,
      'application/zip',
      {
        prefix: `storage/${tenantId}/files`,
        maxSize: MAX_ZIP_SIZE + 10 * 1024 * 1024,
      },
    );

    // Create StorageFile record
    const storageFile = await this.storageFilesRepository.create({
      tenantId,
      folderId: targetFolderId ?? null,
      name: zipFileName,
      originalName: zipFileName,
      fileKey: uploadResult.key,
      path: `/${zipFileName}`,
      size: zipBuffer.length,
      mimeType: 'application/zip',
      fileType: 'archive',
      uploadedBy: userId,
    });

    return { file: storageFile };
  }
}
