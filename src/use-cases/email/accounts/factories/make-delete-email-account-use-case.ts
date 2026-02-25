import { PrismaEmailAccountsRepository } from '@/repositories/email/prisma/prisma-email-accounts-repository';
import { DeleteEmailAccountUseCase } from '../delete-email-account';

export function makeDeleteEmailAccountUseCase() {
  return new DeleteEmailAccountUseCase(new PrismaEmailAccountsRepository());
}
