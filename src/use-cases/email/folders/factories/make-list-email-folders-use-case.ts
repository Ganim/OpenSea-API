import { PrismaEmailAccountsRepository } from '@/repositories/email/prisma/prisma-email-accounts-repository';
import { PrismaEmailFoldersRepository } from '@/repositories/email/prisma/prisma-email-folders-repository';
import { ListEmailFoldersUseCase } from '../list-email-folders';

export function makeListEmailFoldersUseCase() {
  return new ListEmailFoldersUseCase(
    new PrismaEmailAccountsRepository(),
    new PrismaEmailFoldersRepository(),
  );
}
