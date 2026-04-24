import { PrismaUsersRepository } from '@/repositories/core/prisma/prisma-users-repository';
import { InitiatePasswordResetByTotpUseCase } from '../initiate-password-reset-by-totp';

export function makeInitiatePasswordResetByTotpUseCase() {
  const usersRepository = new PrismaUsersRepository();
  return new InitiatePasswordResetByTotpUseCase(usersRepository);
}
