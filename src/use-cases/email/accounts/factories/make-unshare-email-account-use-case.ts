import { PrismaEmailAccountsRepository } from '@/repositories/email/prisma/prisma-email-accounts-repository';
import { UnshareEmailAccountUseCase } from '../unshare-email-account';

export function makeUnshareEmailAccountUseCase() {
  return new UnshareEmailAccountUseCase(new PrismaEmailAccountsRepository());
}
