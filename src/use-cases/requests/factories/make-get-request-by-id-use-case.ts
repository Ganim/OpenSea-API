import { prisma } from '@/lib/prisma';
import { PrismaRequestsRepository } from '@/repositories/requests/prisma/prisma-requests-repository';
import { GetRequestByIdUseCase } from '../get-request-by-id';

export function makeGetRequestByIdUseCase() {
  const requestsRepository = new PrismaRequestsRepository(prisma);

  return new GetRequestByIdUseCase(requestsRepository);
}
