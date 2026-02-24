import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { InitializeTenantFoldersUseCase } from '../initialize-tenant-folders';

export function makeInitializeTenantFoldersUseCase() {
  const storageFoldersRepository = new PrismaStorageFoldersRepository();
  return new InitializeTenantFoldersUseCase(storageFoldersRepository);
}
