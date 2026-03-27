import { PrismaAuthLinksRepository } from '@/repositories/core/prisma/prisma-auth-links-repository';
import { PrismaUsersRepository } from '@/repositories/core/prisma/prisma-users-repository';
import { ResetPasswordByTokenUseCase } from '../reset-password-by-token';

export function makeResetPasswordByTokenUseCase() {
  const usersRepository = new PrismaUsersRepository();
  const authLinksRepository = new PrismaAuthLinksRepository();
  return new ResetPasswordByTokenUseCase(usersRepository, authLinksRepository);
}
