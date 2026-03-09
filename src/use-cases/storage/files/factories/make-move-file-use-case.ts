import { PrismaFolderAccessRulesRepository } from '@/repositories/storage/prisma/prisma-folder-access-rules-repository';
import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { FolderAccessService } from '@/services/storage/folder-access-service';
import { MoveFileUseCase } from '../move-file';

export function makeMoveFileUseCase() {
  const storageFilesRepository = new PrismaStorageFilesRepository();
  const storageFoldersRepository = new PrismaStorageFoldersRepository();
  const folderAccessRulesRepository = new PrismaFolderAccessRulesRepository();
  const folderAccessService = new FolderAccessService(
    folderAccessRulesRepository,
  );

  return new MoveFileUseCase(
    storageFilesRepository,
    storageFoldersRepository,
    folderAccessService,
  );
}
