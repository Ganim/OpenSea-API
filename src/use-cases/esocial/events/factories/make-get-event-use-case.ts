import { PrismaEsocialEventsRepository } from '@/repositories/esocial/prisma/prisma-esocial-events-repository';
import { GetEventUseCase } from '../get-event';

export function makeGetEventUseCase(): GetEventUseCase {
  return new GetEventUseCase(new PrismaEsocialEventsRepository());
}
