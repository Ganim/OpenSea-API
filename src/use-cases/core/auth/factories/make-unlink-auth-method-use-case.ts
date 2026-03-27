import { PrismaAuthLinksRepository } from '@/repositories/core/prisma/prisma-auth-links-repository';
import { UnlinkAuthMethodUseCase } from '../unlink-auth-method';

export function makeUnlinkAuthMethodUseCase() {
  const authLinksRepository = new PrismaAuthLinksRepository();

  return new UnlinkAuthMethodUseCase(authLinksRepository);
}
