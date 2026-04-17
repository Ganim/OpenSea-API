import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SurveyResponse } from '@/entities/hr/survey-response';

export interface CreateSurveyResponseSchema {
  tenantId: string;
  surveyId: UniqueEntityID;
  employeeId?: UniqueEntityID;
  /**
   * Dedupe hash populated only for anonymous submissions. When present it
   * replaces employeeId-based uniqueness (which is impossible once the
   * employeeId is scrubbed). Never returned through any DTO.
   */
  respondentHash?: string;
}

export interface FindSurveyResponseFilters {
  surveyId?: UniqueEntityID;
  employeeId?: UniqueEntityID;
  page?: number;
  perPage?: number;
}

export interface SurveyResponsesRepository {
  create(data: CreateSurveyResponseSchema): Promise<SurveyResponse>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<SurveyResponse | null>;
  findMany(
    tenantId: string,
    filters?: FindSurveyResponseFilters,
  ): Promise<{ responses: SurveyResponse[]; total: number }>;
  findByEmployeeAndSurvey(
    employeeId: UniqueEntityID,
    surveyId: UniqueEntityID,
    tenantId: string,
  ): Promise<SurveyResponse | null>;
  /**
   * Looks up an anonymous response by its respondent hash. Used only to
   * enforce "one response per respondent" when the survey is anonymous.
   */
  findByRespondentHash(
    surveyId: UniqueEntityID,
    respondentHash: string,
    tenantId: string,
  ): Promise<SurveyResponse | null>;
  countBySurvey(surveyId: UniqueEntityID, tenantId: string): Promise<number>;
}
