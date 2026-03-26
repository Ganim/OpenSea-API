import { PrismaEsocialEventsRepository } from '@/repositories/esocial/prisma/prisma-esocial-events-repository';
import { DeleteEventUseCase } from '../delete-event';

export function makeDeleteEventUseCase(): DeleteEventUseCase {
  return new DeleteEventUseCase(new PrismaEsocialEventsRepository());
}
