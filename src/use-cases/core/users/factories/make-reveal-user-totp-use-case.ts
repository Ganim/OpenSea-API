import { PrismaUsersRepository } from '@/repositories/core/prisma/prisma-users-repository';
import { RevealUserTotpUseCase } from '../reveal-user-totp';

export function makeRevealUserTotpUseCase() {
  const usersRepository = new PrismaUsersRepository();
  return new RevealUserTotpUseCase(usersRepository);
}
