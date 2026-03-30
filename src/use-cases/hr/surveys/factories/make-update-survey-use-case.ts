import { PrismaSurveysRepository } from '@/repositories/hr/prisma/prisma-surveys-repository';
import { UpdateSurveyUseCase } from '../update-survey';

export function makeUpdateSurveyUseCase() {
  const surveysRepository = new PrismaSurveysRepository();
  return new UpdateSurveyUseCase(surveysRepository);
}
