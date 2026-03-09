import { env } from '@/@env';
import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { LocalFileUploadService } from '@/services/storage/local-file-upload-service';
import { S3FileUploadService } from '@/services/storage/s3-file-upload-service';
import { PreviewFileUseCase } from '../preview-file';

export function makePreviewFileUseCase() {
  const storageFilesRepository = new PrismaStorageFilesRepository();
  const fileUploadService = env.S3_ENDPOINT
    ? S3FileUploadService.getInstance()
    : new LocalFileUploadService();

  return new PreviewFileUseCase(storageFilesRepository, fileUploadService);
}
