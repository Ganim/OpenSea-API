import { PrismaUsersRepository } from '@/repositories/core/prisma/prisma-users-repository';
import { makeCreateSessionUseCase } from '../../sessions/factories/make-create-session-use-case';
import { AuthenticateWithAccessPinUseCase } from '../authenticate-with-access-pin';

export function makeAuthenticateWithAccessPinUseCase() {
  const usersRepository = new PrismaUsersRepository();
  const createSessionUseCase = makeCreateSessionUseCase();

  return new AuthenticateWithAccessPinUseCase(
    usersRepository,
    createSessionUseCase,
  );
}
