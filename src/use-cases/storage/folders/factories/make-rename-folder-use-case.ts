import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { RenameFolderUseCase } from '../rename-folder';

export function makeRenameFolderUseCase() {
  const storageFoldersRepository = new PrismaStorageFoldersRepository();
  return new RenameFolderUseCase(storageFoldersRepository);
}
