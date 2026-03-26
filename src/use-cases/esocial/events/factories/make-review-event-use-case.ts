import { PrismaEsocialEventsRepository } from '@/repositories/esocial/prisma/prisma-esocial-events-repository';
import { ReviewEventUseCase } from '../review-event';

export function makeReviewEventUseCase(): ReviewEventUseCase {
  return new ReviewEventUseCase(new PrismaEsocialEventsRepository());
}
