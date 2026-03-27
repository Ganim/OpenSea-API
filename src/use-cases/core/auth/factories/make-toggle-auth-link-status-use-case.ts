import { PrismaAuthLinksRepository } from '@/repositories/core/prisma/prisma-auth-links-repository';
import { ToggleAuthLinkStatusUseCase } from '../toggle-auth-link-status';

export function makeToggleAuthLinkStatusUseCase() {
  const authLinksRepository = new PrismaAuthLinksRepository();

  return new ToggleAuthLinkStatusUseCase(authLinksRepository);
}
