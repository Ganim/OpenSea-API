import { PrismaUsersRepository } from '@/repositories/core/prisma/prisma-users-repository';
import { SetActionPinUseCase } from '../set-action-pin';

export function makeSetActionPinUseCase() {
  const usersRepository = new PrismaUsersRepository();
  return new SetActionPinUseCase(usersRepository);
}
