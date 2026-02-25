import { PrismaEmailAccountsRepository } from '@/repositories/email/prisma/prisma-email-accounts-repository';
import { GetEmailAccountUseCase } from '../get-email-account';

export function makeGetEmailAccountUseCase() {
  return new GetEmailAccountUseCase(new PrismaEmailAccountsRepository());
}
