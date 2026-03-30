import { PrismaSurveysRepository } from '@/repositories/hr/prisma/prisma-surveys-repository';
import { DeleteSurveyUseCase } from '../delete-survey';

export function makeDeleteSurveyUseCase() {
  const surveysRepository = new PrismaSurveysRepository();
  return new DeleteSurveyUseCase(surveysRepository);
}
