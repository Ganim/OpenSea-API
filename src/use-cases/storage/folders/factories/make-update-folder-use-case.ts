import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { UpdateFolderUseCase } from '../update-folder';

export function makeUpdateFolderUseCase() {
  const storageFoldersRepository = new PrismaStorageFoldersRepository();
  return new UpdateFolderUseCase(storageFoldersRepository);
}
