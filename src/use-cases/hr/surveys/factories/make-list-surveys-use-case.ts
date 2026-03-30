import { PrismaSurveysRepository } from '@/repositories/hr/prisma/prisma-surveys-repository';
import { ListSurveysUseCase } from '../list-surveys';

export function makeListSurveysUseCase() {
  const surveysRepository = new PrismaSurveysRepository();
  return new ListSurveysUseCase(surveysRepository);
}
