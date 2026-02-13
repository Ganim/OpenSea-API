import { PrismaUsersRepository } from '@/repositories/core/prisma/prisma-users-repository';
import { ForceAccessPinResetUseCase } from '../force-access-pin-reset';

export function makeForceAccessPinResetUseCase() {
  const usersRepository = new PrismaUsersRepository();
  return new ForceAccessPinResetUseCase(usersRepository);
}
