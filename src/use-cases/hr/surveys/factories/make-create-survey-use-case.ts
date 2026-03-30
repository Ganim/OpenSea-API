import { PrismaSurveysRepository } from '@/repositories/hr/prisma/prisma-surveys-repository';
import { CreateSurveyUseCase } from '../create-survey';

export function makeCreateSurveyUseCase() {
  const surveysRepository = new PrismaSurveysRepository();
  return new CreateSurveyUseCase(surveysRepository);
}
