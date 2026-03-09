import { env } from '@/@env';
import { PrismaFolderAccessRulesRepository } from '@/repositories/storage/prisma/prisma-folder-access-rules-repository';
import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { PrismaStorageFileVersionsRepository } from '@/repositories/storage/prisma/prisma-storage-file-versions-repository';
import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { CompositeThumbnailService } from '@/services/storage/composite-thumbnail-service';
import { EncryptionService } from '@/services/storage/encryption-service';
import { FolderAccessService } from '@/services/storage/folder-access-service';
import { LocalFileUploadService } from '@/services/storage/local-file-upload-service';
import { S3FileUploadService } from '@/services/storage/s3-file-upload-service';
import { PdfThumbnailService } from '@/services/storage/pdf-thumbnail-service';
import { SharpThumbnailService } from '@/services/storage/sharp-thumbnail-service';
import { VideoThumbnailService } from '@/services/storage/video-thumbnail-service';
import { UploadFileUseCase } from '../upload-file';

export function makeUploadFileUseCase() {
  const storageFoldersRepository = new PrismaStorageFoldersRepository();
  const storageFilesRepository = new PrismaStorageFilesRepository();
  const storageFileVersionsRepository =
    new PrismaStorageFileVersionsRepository();
  const fileUploadService = env.S3_ENDPOINT
    ? S3FileUploadService.getInstance()
    : new LocalFileUploadService();
  const thumbnailService = new CompositeThumbnailService([
    new SharpThumbnailService(),
    new PdfThumbnailService(),
    new VideoThumbnailService(),
  ]);
  const folderAccessRulesRepository = new PrismaFolderAccessRulesRepository();
  const folderAccessService = new FolderAccessService(
    folderAccessRulesRepository,
  );

  const encryptionService = env.STORAGE_ENCRYPTION_KEY
    ? new EncryptionService(env.STORAGE_ENCRYPTION_KEY)
    : undefined;

  return new UploadFileUseCase(
    storageFoldersRepository,
    storageFilesRepository,
    storageFileVersionsRepository,
    fileUploadService,
    thumbnailService,
    folderAccessService,
    encryptionService,
  );
}
