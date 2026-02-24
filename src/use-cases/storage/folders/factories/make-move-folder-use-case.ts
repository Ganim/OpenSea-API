import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { MoveFolderUseCase } from '../move-folder';

export function makeMoveFolderUseCase() {
  const storageFoldersRepository = new PrismaStorageFoldersRepository();
  return new MoveFolderUseCase(storageFoldersRepository);
}
