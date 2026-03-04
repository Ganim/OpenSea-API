import * as unzipper from 'unzipper';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FileType } from '@/entities/storage/value-objects/file-type';
import type { StorageFile } from '@/entities/storage/storage-file';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';
import type { FileUploadService } from '@/services/storage/file-upload-service';
import mime from 'mime-types';

interface DecompressFileUseCaseRequest {
  tenantId: string;
  fileId: string;
  targetFolderId?: string | null;
  userId: string;
}

interface DecompressFileUseCaseResponse {
  files: StorageFile[];
  folderCount: number;
}

const MAX_EXTRACT_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_FILES = 1000;

export class DecompressFileUseCase {
  constructor(
    private storageFilesRepository: StorageFilesRepository,
    private storageFoldersRepository: StorageFoldersRepository,
    private fileUploadService: FileUploadService,
  ) {}

  async execute(
    request: DecompressFileUseCaseRequest,
  ): Promise<DecompressFileUseCaseResponse> {
    const { tenantId, fileId, targetFolderId, userId } = request;

    const file = await this.storageFilesRepository.findById(
      new UniqueEntityID(fileId),
      tenantId,
    );

    if (!file) {
      throw new ResourceNotFoundError('Arquivo não encontrado.');
    }

    const allowedMimes = ['application/zip', 'application/x-zip-compressed'];
    if (!allowedMimes.includes(file.mimeType)) {
      throw new BadRequestError(
        'Apenas arquivos ZIP podem ser descompactados.',
      );
    }

    // Download the ZIP from S3
    const zipBuffer = await this.fileUploadService.getObject(file.fileKey);

    // Parse the ZIP
    const directory = await unzipper.Open.buffer(zipBuffer);

    // Security checks
    if (directory.files.length > MAX_FILES) {
      throw new BadRequestError(
        `O arquivo ZIP contém mais de ${MAX_FILES} arquivos.`,
      );
    }

    const totalSize = directory.files.reduce(
      (sum, f) => sum + f.uncompressedSize,
      0,
    );
    if (totalSize > MAX_EXTRACT_SIZE) {
      throw new BadRequestError(
        `O tamanho descompactado excede o limite de ${Math.round(MAX_EXTRACT_SIZE / 1024 / 1024)}MB.`,
      );
    }

    // Determine target folder
    const destFolderId = targetFolderId ?? file.folderId?.toString() ?? null;

    // Track created folders
    const createdFolders = new Map<string, string>(); // zipDir -> folderId
    let folderCount = 0;

    const extractedFiles: StorageFile[] = [];

    for (const entry of directory.files) {
      // Skip directories (they'll be created on demand)
      if (entry.type === 'Directory') continue;

      // Security: block path traversal
      if (entry.path.includes('..') || entry.path.startsWith('/')) continue;

      // Skip macOS metadata
      if (
        entry.path.startsWith('__MACOSX/') ||
        entry.path.endsWith('.DS_Store')
      )
        continue;

      const parts = entry.path.split('/');
      const fileName = parts[parts.length - 1];
      if (!fileName) continue;

      // Create intermediate folders if needed
      let currentFolderId = destFolderId;
      if (parts.length > 1) {
        const dirParts = parts.slice(0, -1);
        let dirPath = '';

        for (const dirPart of dirParts) {
          dirPath = dirPath ? `${dirPath}/${dirPart}` : dirPart;

          if (!createdFolders.has(dirPath)) {
            const slug = dirPart
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '-');

            const folder = await this.storageFoldersRepository.create({
              tenantId,
              parentId: currentFolderId,
              name: dirPart,
              slug: `${slug}-${Date.now()}`,
              path: `/${dirPath}`,
              createdBy: userId,
            });

            createdFolders.set(dirPath, folder.folderId.toString());
            currentFolderId = folder.folderId.toString();
            folderCount++;
          } else {
            currentFolderId = createdFolders.get(dirPath)!;
          }
        }
      }

      // Extract file content
      const content = await entry.buffer();

      // Determine MIME type
      const mimeType = (mime.lookup(fileName) ||
        'application/octet-stream') as string;
      const fileType = FileType.fromMimeType(mimeType);

      // Upload to S3
      const uploadResult = await this.fileUploadService.upload(
        content,
        fileName,
        mimeType,
        {
          prefix: `storage/${tenantId}/files`,
          maxSize: MAX_EXTRACT_SIZE,
        },
      );

      // Create StorageFile record
      const storageFile = await this.storageFilesRepository.create({
        tenantId,
        folderId: currentFolderId,
        name: fileName,
        originalName: fileName,
        fileKey: uploadResult.key,
        path: `/${entry.path}`,
        size: content.length,
        mimeType,
        fileType: fileType.value,
        uploadedBy: userId,
      });

      extractedFiles.push(storageFile);
    }

    return { files: extractedFiles, folderCount };
  }
}
