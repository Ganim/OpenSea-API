import { PrismaAuthLinksRepository } from '@/repositories/core/prisma/prisma-auth-links-repository';
import { PrismaUsersRepository } from '@/repositories/core/prisma/prisma-users-repository';
import { makeCreateSessionUseCase } from '../../sessions/factories/make-create-session-use-case';
import { AuthenticateUnifiedUseCase } from '../authenticate-unified';

export function makeAuthenticateUnifiedUseCase() {
  const authLinksRepository = new PrismaAuthLinksRepository();
  const usersRepository = new PrismaUsersRepository();
  const createSessionUseCase = makeCreateSessionUseCase();

  return new AuthenticateUnifiedUseCase(
    authLinksRepository,
    usersRepository,
    createSessionUseCase,
  );
}
