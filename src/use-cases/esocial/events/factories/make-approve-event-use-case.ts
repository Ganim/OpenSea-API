import { PrismaEsocialEventsRepository } from '@/repositories/esocial/prisma/prisma-esocial-events-repository';
import { ApproveEventUseCase } from '../approve-event';

export function makeApproveEventUseCase(): ApproveEventUseCase {
  return new ApproveEventUseCase(new PrismaEsocialEventsRepository());
}
