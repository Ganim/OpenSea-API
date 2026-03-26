import { PrismaEsocialEventsRepository } from '@/repositories/esocial/prisma/prisma-esocial-events-repository';
import { RejectEventUseCase } from '../reject-event';

export function makeRejectEventUseCase(): RejectEventUseCase {
  return new RejectEventUseCase(new PrismaEsocialEventsRepository());
}
