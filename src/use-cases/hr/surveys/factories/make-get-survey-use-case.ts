import { PrismaSurveysRepository } from '@/repositories/hr/prisma/prisma-surveys-repository';
import { GetSurveyUseCase } from '../get-survey';

export function makeGetSurveyUseCase() {
  const surveysRepository = new PrismaSurveysRepository();
  return new GetSurveyUseCase(surveysRepository);
}
