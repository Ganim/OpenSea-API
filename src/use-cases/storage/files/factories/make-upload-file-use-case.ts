import { env } from '@/@env';
import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { PrismaStorageFileVersionsRepository } from '@/repositories/storage/prisma/prisma-storage-file-versions-repository';
import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { CompositeThumbnailService } from '@/services/storage/composite-thumbnail-service';
import { LocalFileUploadService } from '@/services/storage/local-file-upload-service';
import { S3FileUploadService } from '@/services/storage/s3-file-upload-service';
import { SharpThumbnailService } from '@/services/storage/sharp-thumbnail-service';
import { UploadFileUseCase } from '../upload-file';

export function makeUploadFileUseCase() {
  const storageFoldersRepository = new PrismaStorageFoldersRepository();
  const storageFilesRepository = new PrismaStorageFilesRepository();
  const storageFileVersionsRepository =
    new PrismaStorageFileVersionsRepository();
  const fileUploadService = env.S3_ENDPOINT
    ? new S3FileUploadService()
    : new LocalFileUploadService();
  const thumbnailService = new CompositeThumbnailService([
    new SharpThumbnailService(),
    // Future services (e.g., PdfThumbnailService) can be added here
  ]);

  return new UploadFileUseCase(
    storageFoldersRepository,
    storageFilesRepository,
    storageFileVersionsRepository,
    fileUploadService,
    thumbnailService,
  );
}
