import { PrismaAuthLinksRepository } from '@/repositories/core/prisma/prisma-auth-links-repository';
import { PrismaUsersRepository } from '@/repositories/core/prisma/prisma-users-repository';
import { ChangeMyPasswordUseCase } from '../change-my-password';

export function makeChangeMyPasswordUseCase() {
  const usersRepository = new PrismaUsersRepository();
  const authLinksRepository = new PrismaAuthLinksRepository();
  return new ChangeMyPasswordUseCase(usersRepository, authLinksRepository);
}
