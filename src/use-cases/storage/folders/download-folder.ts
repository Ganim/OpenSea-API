import archiver from 'archiver';
import { PassThrough } from 'node:stream';

import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageFile } from '@/entities/storage/storage-file';
import type { StorageFolder } from '@/entities/storage/storage-folder';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';
import type { FileUploadService } from '@/services/storage/file-upload-service';

interface DownloadFolderUseCaseRequest {
  tenantId: string;
  folderId: string;
}

interface DownloadFolderUseCaseResponse {
  url: string;
  fileName: string;
}

const MAX_ZIP_SIZE = 500 * 1024 * 1024; // 500MB total file size limit

export class DownloadFolderUseCase {
  constructor(
    private storageFoldersRepository: StorageFoldersRepository,
    private storageFilesRepository: StorageFilesRepository,
    private fileUploadService: FileUploadService,
  ) {}

  async execute(
    request: DownloadFolderUseCaseRequest,
  ): Promise<DownloadFolderUseCaseResponse> {
    const { tenantId, folderId } = request;

    const folder = await this.storageFoldersRepository.findById(
      new UniqueEntityID(folderId),
      tenantId,
    );

    if (!folder) {
      throw new ResourceNotFoundError('Folder not found');
    }

    // Get all descendant folders
    const descendants = await this.storageFoldersRepository.findDescendants(
      new UniqueEntityID(folderId),
      tenantId,
    );

    const allFolderIds = [folderId, ...descendants.map((d) => d.id.toString())];

    // Collect all files from the folder and its descendants
    const allFiles: StorageFile[] = [];
    for (const id of allFolderIds) {
      const result = await this.storageFilesRepository.findMany({
        tenantId,
        folderId: id,
        limit: 1000,
      });
      allFiles.push(...result.files);
    }

    // Check total size
    const totalSize = allFiles.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > MAX_ZIP_SIZE) {
      throw new Error(
        `A pasta excede o limite de ${Math.round(MAX_ZIP_SIZE / 1024 / 1024)}MB para download como ZIP.`,
      );
    }

    // Build folder path map for organizing files in the ZIP
    const folderPathMap = new Map<string, string>();
    folderPathMap.set(folderId, '');
    for (const desc of descendants) {
      const relativePath = desc.path.replace(folder.path, '').replace(/^\//, '');
      folderPathMap.set(desc.id.toString(), relativePath);
    }

    // Create ZIP archive
    const archive = archiver('zip', { zlib: { level: 6 } });
    const passThrough = new PassThrough();
    const chunks: Buffer[] = [];

    passThrough.on('data', (chunk: Buffer) => chunks.push(chunk));
    archive.pipe(passThrough);

    // Add files to archive
    for (const file of allFiles) {
      const folderRelPath = folderPathMap.get(file.folderId ?? '') ?? '';
      const zipPath = folderRelPath
        ? `${folderRelPath}/${file.name}`
        : file.name;

      const fileBuffer = await this.fileUploadService.getObject(file.fileKey);
      archive.append(fileBuffer, { name: zipPath });
    }

    // Also add empty directories
    for (const desc of descendants) {
      const relativePath = folderPathMap.get(desc.id.toString());
      if (relativePath) {
        const hasFiles = allFiles.some(
          (f) => f.folderId === desc.id.toString(),
        );
        if (!hasFiles) {
          archive.append('', { name: `${relativePath}/` });
        }
      }
    }

    await archive.finalize();

    // Wait for all data to be collected
    await new Promise<void>((resolve, reject) => {
      passThrough.on('end', resolve);
      passThrough.on('error', reject);
    });

    const zipBuffer = Buffer.concat(chunks);
    const zipFileName = `${folder.slug}-${Date.now()}.zip`;

    // Upload ZIP to temp location in S3
    const uploadResult = await this.fileUploadService.upload(
      zipBuffer,
      zipFileName,
      'application/zip',
      {
        prefix: `storage/${tenantId}/temp-downloads`,
        maxSize: MAX_ZIP_SIZE + 10 * 1024 * 1024, // Allow for ZIP overhead
      },
    );

    // Return presigned URL (1 hour expiry)
    const url = await this.fileUploadService.getPresignedUrl(
      uploadResult.key,
      3600,
    );

    return {
      url,
      fileName: zipFileName,
    };
  }
}
