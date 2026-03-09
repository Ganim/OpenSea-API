import { env } from '@/@env';
import { PrismaFolderAccessRulesRepository } from '@/repositories/storage/prisma/prisma-folder-access-rules-repository';
import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { PrismaStorageFileVersionsRepository } from '@/repositories/storage/prisma/prisma-storage-file-versions-repository';
import { FolderAccessService } from '@/services/storage/folder-access-service';
import { LocalFileUploadService } from '@/services/storage/local-file-upload-service';
import { S3FileUploadService } from '@/services/storage/s3-file-upload-service';
import { DownloadFileUseCase } from '../download-file';

export function makeDownloadFileUseCase() {
  const storageFilesRepository = new PrismaStorageFilesRepository();
  const storageFileVersionsRepository =
    new PrismaStorageFileVersionsRepository();
  const fileUploadService = env.S3_ENDPOINT
    ? S3FileUploadService.getInstance()
    : new LocalFileUploadService();
  const folderAccessRulesRepository = new PrismaFolderAccessRulesRepository();
  const folderAccessService = new FolderAccessService(
    folderAccessRulesRepository,
  );

  return new DownloadFileUseCase(
    storageFilesRepository,
    storageFileVersionsRepository,
    fileUploadService,
    folderAccessService,
  );
}
