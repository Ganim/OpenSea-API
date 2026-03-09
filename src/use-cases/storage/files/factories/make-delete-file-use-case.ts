import { PrismaFolderAccessRulesRepository } from '@/repositories/storage/prisma/prisma-folder-access-rules-repository';
import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { FolderAccessService } from '@/services/storage/folder-access-service';
import { DeleteFileUseCase } from '../delete-file';

export function makeDeleteFileUseCase() {
  const storageFilesRepository = new PrismaStorageFilesRepository();
  const folderAccessRulesRepository = new PrismaFolderAccessRulesRepository();
  const folderAccessService = new FolderAccessService(
    folderAccessRulesRepository,
  );

  return new DeleteFileUseCase(storageFilesRepository, folderAccessService);
}
