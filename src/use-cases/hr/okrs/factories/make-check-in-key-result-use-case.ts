import { PrismaKeyResultsRepository } from '@/repositories/hr/prisma/prisma-key-results-repository';
import { PrismaOKRCheckInsRepository } from '@/repositories/hr/prisma/prisma-okr-check-ins-repository';
import { PrismaObjectivesRepository } from '@/repositories/hr/prisma/prisma-objectives-repository';
import { CheckInKeyResultUseCase } from '../check-in-key-result';

export function makeCheckInKeyResultUseCase() {
  const keyResultsRepository = new PrismaKeyResultsRepository();
  const checkInsRepository = new PrismaOKRCheckInsRepository();
  const objectivesRepository = new PrismaObjectivesRepository();
  return new CheckInKeyResultUseCase(
    keyResultsRepository,
    checkInsRepository,
    objectivesRepository,
  );
}
