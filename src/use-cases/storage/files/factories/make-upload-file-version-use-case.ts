import { env } from '@/@env';
import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { PrismaStorageFileVersionsRepository } from '@/repositories/storage/prisma/prisma-storage-file-versions-repository';
import { LocalFileUploadService } from '@/services/storage/local-file-upload-service';
import { S3FileUploadService } from '@/services/storage/s3-file-upload-service';
import { UploadFileVersionUseCase } from '../upload-file-version';

export function makeUploadFileVersionUseCase() {
  const storageFilesRepository = new PrismaStorageFilesRepository();
  const storageFileVersionsRepository =
    new PrismaStorageFileVersionsRepository();
  const fileUploadService = env.S3_ENDPOINT
    ? new S3FileUploadService()
    : new LocalFileUploadService();

  return new UploadFileVersionUseCase(
    storageFilesRepository,
    storageFileVersionsRepository,
    fileUploadService,
  );
}
