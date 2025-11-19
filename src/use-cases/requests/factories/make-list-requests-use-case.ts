import { prisma } from '@/lib/prisma';
import { PrismaRequestsRepository } from '@/repositories/requests/prisma/prisma-requests-repository';
import { ListRequestsUseCase } from '../list-requests';

export function makeListRequestsUseCase() {
  const requestsRepository = new PrismaRequestsRepository(prisma);

  return new ListRequestsUseCase(requestsRepository);
}
