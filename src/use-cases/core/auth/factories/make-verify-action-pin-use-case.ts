import { PrismaUsersRepository } from '@/repositories/core/prisma/prisma-users-repository';
import { VerifyActionPinUseCase } from '../verify-action-pin';

export function makeVerifyActionPinUseCase() {
  const usersRepository = new PrismaUsersRepository();
  return new VerifyActionPinUseCase(usersRepository);
}
