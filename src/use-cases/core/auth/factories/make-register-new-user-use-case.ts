import { PrismaAuthLinksRepository } from '@/repositories/core/prisma/prisma-auth-links-repository';
import { PrismaUsersRepository } from '@/repositories/core/prisma/prisma-users-repository';
import { RegisterNewUserUseCase } from '../register-new-user';

export function makeRegisterNewUserUseCase() {
  const usersRepository = new PrismaUsersRepository();
  const authLinksRepository = new PrismaAuthLinksRepository();
  const registerNewUser = new RegisterNewUserUseCase(
    usersRepository,
    authLinksRepository,
  );

  return registerNewUser;
}
