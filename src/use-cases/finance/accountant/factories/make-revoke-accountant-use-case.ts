import { PrismaAccountantAccessesRepository } from '@/repositories/finance/prisma/prisma-accountant-accesses-repository';
import { RevokeAccountantUseCase } from '../revoke-accountant';

export function makeRevokeAccountantUseCase() {
  const repository = new PrismaAccountantAccessesRepository();
  return new RevokeAccountantUseCase(repository);
}
