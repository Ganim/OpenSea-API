import { PrismaAuthLinksRepository } from '@/repositories/core/prisma/prisma-auth-links-repository';
import { ListAuthLinksUseCase } from '../list-auth-links';

export function makeListAuthLinksUseCase() {
  const authLinksRepository = new PrismaAuthLinksRepository();

  return new ListAuthLinksUseCase(authLinksRepository);
}
