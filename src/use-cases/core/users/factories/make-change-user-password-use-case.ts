import { PrismaAuthLinksRepository } from '@/repositories/core/prisma/prisma-auth-links-repository';
import { PrismaUsersRepository } from '@/repositories/core/prisma/prisma-users-repository';
import { ChangeUserPasswordUseCase } from '../change-user-password';

export function makeChangeUserPasswordUseCase() {
  const usersRepository = new PrismaUsersRepository();
  const authLinksRepository = new PrismaAuthLinksRepository();
  return new ChangeUserPasswordUseCase(usersRepository, authLinksRepository);
}
