import { PrismaMagicLinkTokensRepository } from '@/repositories/core/prisma/prisma-magic-link-tokens-repository';
import { PrismaUsersRepository } from '@/repositories/core/prisma/prisma-users-repository';
import { makeCreateSessionUseCase } from '../../sessions/factories/make-create-session-use-case';
import { VerifyMagicLinkUseCase } from '../verify-magic-link';

export function makeVerifyMagicLinkUseCase() {
  const magicLinkTokensRepository = new PrismaMagicLinkTokensRepository();
  const usersRepository = new PrismaUsersRepository();
  const createSessionUseCase = makeCreateSessionUseCase();

  return new VerifyMagicLinkUseCase(
    magicLinkTokensRepository,
    usersRepository,
    createSessionUseCase,
  );
}
