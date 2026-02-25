import { PrismaEmailAccountsRepository } from '@/repositories/email/prisma/prisma-email-accounts-repository';
import { ListEmailAccountsUseCase } from '../list-email-accounts';

export function makeListEmailAccountsUseCase() {
  return new ListEmailAccountsUseCase(new PrismaEmailAccountsRepository());
}
