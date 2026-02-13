import { PrismaUsersRepository } from '@/repositories/core/prisma/prisma-users-repository';
import { ForceActionPinResetUseCase } from '../force-action-pin-reset';

export function makeForceActionPinResetUseCase() {
  const usersRepository = new PrismaUsersRepository();
  return new ForceActionPinResetUseCase(usersRepository);
}
