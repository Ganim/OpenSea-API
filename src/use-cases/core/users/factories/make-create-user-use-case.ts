import { PrismaAuthLinksRepository } from '@/repositories/core/prisma/prisma-auth-links-repository';
import { PrismaUsersRepository } from '@/repositories/core/prisma/prisma-users-repository';
import { CreateUserUseCase } from '../create-user';

export function makeCreateUserUseCase() {
  const usersRepository = new PrismaUsersRepository();
  const authLinksRepository = new PrismaAuthLinksRepository();
  const createUserUseCase = new CreateUserUseCase(
    usersRepository,
    authLinksRepository,
  );
  return createUserUseCase;
}
