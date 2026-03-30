import { PrismaSurveysRepository } from '@/repositories/hr/prisma/prisma-surveys-repository';
import { CloseSurveyUseCase } from '../close-survey';

export function makeCloseSurveyUseCase() {
  const surveysRepository = new PrismaSurveysRepository();
  return new CloseSurveyUseCase(surveysRepository);
}
