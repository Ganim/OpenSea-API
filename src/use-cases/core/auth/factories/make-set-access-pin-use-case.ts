import { PrismaUsersRepository } from '@/repositories/core/prisma/prisma-users-repository';
import { SetAccessPinUseCase } from '../set-access-pin';

export function makeSetAccessPinUseCase() {
  const usersRepository = new PrismaUsersRepository();
  return new SetAccessPinUseCase(usersRepository);
}
