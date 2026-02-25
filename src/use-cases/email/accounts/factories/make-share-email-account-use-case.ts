import { PrismaEmailAccountsRepository } from '@/repositories/email/prisma/prisma-email-accounts-repository';
import { ShareEmailAccountUseCase } from '../share-email-account';

export function makeShareEmailAccountUseCase() {
  return new ShareEmailAccountUseCase(new PrismaEmailAccountsRepository());
}
