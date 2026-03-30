import { PrismaSurveyQuestionsRepository } from '@/repositories/hr/prisma/prisma-survey-questions-repository';
import { PrismaSurveysRepository } from '@/repositories/hr/prisma/prisma-surveys-repository';
import { ActivateSurveyUseCase } from '../activate-survey';

export function makeActivateSurveyUseCase() {
  const surveysRepository = new PrismaSurveysRepository();
  const questionsRepository = new PrismaSurveyQuestionsRepository();
  return new ActivateSurveyUseCase(surveysRepository, questionsRepository);
}
