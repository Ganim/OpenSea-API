import { PrismaAccountantAccessesRepository } from '@/repositories/finance/prisma/prisma-accountant-accesses-repository';
import { InviteAccountantUseCase } from '../invite-accountant';

export function makeInviteAccountantUseCase() {
  const repository = new PrismaAccountantAccessesRepository();
  return new InviteAccountantUseCase(repository);
}
