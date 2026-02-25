import { env } from '@/@env';
import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { PrismaStorageShareLinksRepository } from '@/repositories/storage/prisma/prisma-storage-share-links-repository';
import { LocalFileUploadService } from '@/services/storage/local-file-upload-service';
import { S3FileUploadService } from '@/services/storage/s3-file-upload-service';
import { DownloadSharedFileUseCase } from '../download-shared-file';

export function makeDownloadSharedFileUseCase() {
  const storageFilesRepository = new PrismaStorageFilesRepository();
  const storageShareLinksRepository = new PrismaStorageShareLinksRepository();
  const fileUploadService = env.S3_ENDPOINT
    ? new S3FileUploadService()
    : new LocalFileUploadService();

  return new DownloadSharedFileUseCase(
    storageFilesRepository,
    storageShareLinksRepository,
    fileUploadService,
  );
}
