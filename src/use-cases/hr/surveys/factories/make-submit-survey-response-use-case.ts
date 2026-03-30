import { PrismaSurveyAnswersRepository } from '@/repositories/hr/prisma/prisma-survey-answers-repository';
import { PrismaSurveyResponsesRepository } from '@/repositories/hr/prisma/prisma-survey-responses-repository';
import { PrismaSurveysRepository } from '@/repositories/hr/prisma/prisma-surveys-repository';
import { SubmitSurveyResponseUseCase } from '../submit-survey-response';

export function makeSubmitSurveyResponseUseCase() {
  const surveysRepository = new PrismaSurveysRepository();
  const responsesRepository = new PrismaSurveyResponsesRepository();
  const answersRepository = new PrismaSurveyAnswersRepository();
  return new SubmitSurveyResponseUseCase(
    surveysRepository,
    responsesRepository,
    answersRepository,
  );
}
