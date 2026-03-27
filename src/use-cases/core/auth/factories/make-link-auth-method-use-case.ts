import { PrismaAuthLinksRepository } from '@/repositories/core/prisma/prisma-auth-links-repository';
import { PrismaUsersRepository } from '@/repositories/core/prisma/prisma-users-repository';
import { LinkAuthMethodUseCase } from '../link-auth-method';

export function makeLinkAuthMethodUseCase() {
  const authLinksRepository = new PrismaAuthLinksRepository();
  const usersRepository = new PrismaUsersRepository();

  return new LinkAuthMethodUseCase(authLinksRepository, usersRepository);
}
