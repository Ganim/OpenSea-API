import { PrismaEsocialEventsRepository } from '@/repositories/esocial/prisma/prisma-esocial-events-repository';
import { RectifyEventUseCase } from '../rectify-event';

export function makeRectifyEventUseCase(): RectifyEventUseCase {
  return new RectifyEventUseCase(new PrismaEsocialEventsRepository());
}
