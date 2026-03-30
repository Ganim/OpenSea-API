import { PrismaSurveyQuestionsRepository } from '@/repositories/hr/prisma/prisma-survey-questions-repository';
import { PrismaSurveysRepository } from '@/repositories/hr/prisma/prisma-surveys-repository';
import { CreateSurveyQuestionUseCase } from '../create-survey-question';

export function makeCreateSurveyQuestionUseCase() {
  const surveysRepository = new PrismaSurveysRepository();
  const questionsRepository = new PrismaSurveyQuestionsRepository();
  return new CreateSurveyQuestionUseCase(
    surveysRepository,
    questionsRepository,
  );
}
