import { createHash } from 'node:crypto';
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

/**
 * Computes the anonymity-preserving dedupe hash for an anonymous survey
 * submission. Using tenantId + surveyId + employeeId + a process-wide secret
 * guarantees:
 *   - the hash can't collide across surveys or tenants
 *   - the same employee produces the same hash across attempts (dedupe)
 *   - the hash is irreversible without access to ANON_HASH_SECRET
 *     (attackers with DB access alone cannot de-anonymize respondents)
 */
function computeRespondentHash(
  tenantId: string,
  surveyId: string,
  employeeId: string,
): string {
  // Fall back to JWT_SECRET when no dedicated key is configured — still
  // infeasible to brute-force an employeeId from the hash without access to
  // the application secret. We read process.env directly (instead of the
  // zod-validated env module) so unit tests that don't boot the full env
  // schema can still exercise this path; production always has JWT_SECRET
  // validated at startup by @/@env.
  const secret =
    process.env.ANON_HASH_SECRET ??
    process.env.JWT_SECRET ??
    'opensea-anon-dev';
  return createHash('sha256')
    .update(`${tenantId}::${surveyId}::${employeeId}::${secret}`)
    .digest('hex');
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

    // Anonymous surveys MUST NOT persist employeeId (psychological safety
    // guarantee — see P0-02 safety fix). We still enforce "one response per
    // respondent" through an irreversible hash stored in respondent_hash.
    if (survey.isAnonymous) {
      if (!request.employeeId) {
        // Without an employeeId we cannot dedupe at all. Accept the submission
        // (e.g. public-link surveys) but persist with no identity.
        const surveyResponse = await this.surveyResponsesRepository.create({
          tenantId: request.tenantId,
          surveyId,
        });
        await this.persistAnswers(request, surveyResponse.id);
        return { surveyResponse };
      }

      const respondentHash = computeRespondentHash(
        request.tenantId,
        surveyId.toString(),
        request.employeeId,
      );

      const existingAnonymousResponse =
        await this.surveyResponsesRepository.findByRespondentHash(
          surveyId,
          respondentHash,
          request.tenantId,
        );

      if (existingAnonymousResponse) {
        throw new Error('Employee has already submitted a response');
      }

      const surveyResponse = await this.surveyResponsesRepository.create({
        tenantId: request.tenantId,
        surveyId,
        // Intentionally omit employeeId: persisting it would break anonymity.
        respondentHash,
      });

      await this.persistAnswers(request, surveyResponse.id);
      return { surveyResponse };
    }

    // Non-anonymous path: store employeeId as-is so HR can see who answered.
    if (request.employeeId) {
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

    await this.persistAnswers(request, surveyResponse.id);
    return { surveyResponse };
  }

  private async persistAnswers(
    request: SubmitSurveyResponseRequest,
    surveyResponseId: UniqueEntityID,
  ): Promise<void> {
    if (request.answers.length === 0) return;

    await this.surveyAnswersRepository.bulkCreate(
      request.answers.map((answer) => ({
        tenantId: request.tenantId,
        surveyResponseId,
        questionId: new UniqueEntityID(answer.questionId),
        ratingValue: answer.ratingValue,
        textValue: answer.textValue,
        selectedOptions: answer.selectedOptions,
      })),
    );
  }
}
