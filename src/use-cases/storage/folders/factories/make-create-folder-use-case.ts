import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { CreateFolderUseCase } from '../create-folder';

export function makeCreateFolderUseCase() {
  const storageFoldersRepository = new PrismaStorageFoldersRepository();
  return new CreateFolderUseCase(storageFoldersRepository);
}
