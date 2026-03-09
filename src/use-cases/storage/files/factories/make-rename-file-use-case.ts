import { PrismaFolderAccessRulesRepository } from '@/repositories/storage/prisma/prisma-folder-access-rules-repository';
import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { FolderAccessService } from '@/services/storage/folder-access-service';
import { RenameFileUseCase } from '../rename-file';

export function makeRenameFileUseCase() {
  const storageFilesRepository = new PrismaStorageFilesRepository();
  const storageFoldersRepository = new PrismaStorageFoldersRepository();
  const folderAccessRulesRepository = new PrismaFolderAccessRulesRepository();
  const folderAccessService = new FolderAccessService(
    folderAccessRulesRepository,
  );

  return new RenameFileUseCase(
    storageFilesRepository,
    storageFoldersRepository,
    folderAccessService,
  );
}
