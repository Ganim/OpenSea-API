import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SurveyResponse } from '@/entities/hr/survey-response';
import type { SurveyAnswersRepository } from '@/repositories/hr/survey-answers-repository';
import type { SurveyResponsesRepository } from '@/repositories/hr/survey-responses-repository';
import type { SurveysRepository } from '@/repositories/hr/surveys-repository';

export interface SubmitSurveyAnswerInput {
  questionId: string;
  ratingValue?: number;
  textValue?: string;
  selectedOptions?: unknown;
}

export interface SubmitSurveyResponseRequest {
  tenantId: string;
  surveyId: string;
  employeeId?: string;
  answers: SubmitSurveyAnswerInput[];
}

export interface SubmitSurveyResponseResponse {
  surveyResponse: SurveyResponse;
}

export class SubmitSurveyResponseUseCase {
  constructor(
    private surveysRepository: SurveysRepository,
    private surveyResponsesRepository: SurveyResponsesRepository,
    private surveyAnswersRepository: SurveyAnswersRepository,
  ) {}

  async execute(
    request: SubmitSurveyResponseRequest,
  ): Promise<SubmitSurveyResponseResponse> {
    const surveyId = new UniqueEntityID(request.surveyId);

    const survey = await this.surveysRepository.findById(
      surveyId,
      request.tenantId,
    );

    if (!survey) {
      throw new Error('Survey not found');
    }

    if (!survey.isActive()) {
      throw new Error('Survey is not active');
    }

    if (request.employeeId && !survey.isAnonymous) {
      const existingResponse =
        await this.surveyResponsesRepository.findByEmployeeAndSurvey(
          new UniqueEntityID(request.employeeId),
          surveyId,
          request.tenantId,
        );

      if (existingResponse) {
        throw new Error('Employee has already submitted a response');
      }
    }

    const surveyResponse = await this.surveyResponsesRepository.create({
      tenantId: request.tenantId,
      surveyId,
      employeeId: request.employeeId
        ? new UniqueEntityID(request.employeeId)
        : undefined,
    });

    if (request.answers.length > 0) {
      await this.surveyAnswersRepository.bulkCreate(
        request.answers.map((answer) => ({
          tenantId: request.tenantId,
          surveyResponseId: surveyResponse.id,
          questionId: new UniqueEntityID(answer.questionId),
          ratingValue: answer.ratingValue,
          textValue: answer.textValue,
          selectedOptions: answer.selectedOptions,
        })),
      );
    }

    return { surveyResponse };
  }
}
