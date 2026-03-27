import { PrismaAuthLinksRepository } from '@/repositories/core/prisma/prisma-auth-links-repository';
import { PrismaMagicLinkTokensRepository } from '@/repositories/core/prisma/prisma-magic-link-tokens-repository';
import { PrismaUsersRepository } from '@/repositories/core/prisma/prisma-users-repository';
import { EmailService } from '@/services/email-service';
import { RequestMagicLinkUseCase } from '../request-magic-link';

export function makeRequestMagicLinkUseCase() {
  const authLinksRepository = new PrismaAuthLinksRepository();
  const usersRepository = new PrismaUsersRepository();
  const magicLinkTokensRepository = new PrismaMagicLinkTokensRepository();
  const emailService = new EmailService();

  return new RequestMagicLinkUseCase(
    authLinksRepository,
    usersRepository,
    magicLinkTokensRepository,
    emailService,
  );
}
