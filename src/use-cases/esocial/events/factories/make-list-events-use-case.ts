import { PrismaEsocialEventsRepository } from '@/repositories/esocial/prisma/prisma-esocial-events-repository';
import { ListEventsUseCase } from '../list-events';

export function makeListEventsUseCase(): ListEventsUseCase {
  return new ListEventsUseCase(new PrismaEsocialEventsRepository());
}
