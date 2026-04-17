import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SurveyQuestion } from '@/entities/hr/survey-question';

export interface CreateSurveyQuestionSchema {
  tenantId: string;
  surveyId: UniqueEntityID;
  text: string;
  type: string;
  options?: unknown;
  order: number;
  isRequired?: boolean;
  category: string;
}

export interface UpdateSurveyQuestionSchema {
  id: UniqueEntityID;
  /**
   * Tenant identifier for multi-tenant write isolation. Optional for backward
   * compatibility during the defense-in-depth rollout, but callers MUST pass
   * it so the underlying Prisma `where` clause is scoped and cannot update a
   * record belonging to another tenant.
   */
  tenantId?: string;
  text?: string;
  type?: string;
  options?: unknown;
  order?: number;
  isRequired?: boolean;
  category?: string;
}

export interface SurveyQuestionsRepository {
  create(data: CreateSurveyQuestionSchema): Promise<SurveyQuestion>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<SurveyQuestion | null>;
  findBySurvey(
    surveyId: UniqueEntityID,
    tenantId: string,
  ): Promise<SurveyQuestion[]>;
  update(data: UpdateSurveyQuestionSchema): Promise<SurveyQuestion | null>;
  delete(id: UniqueEntityID, tenantId?: string): Promise<void>;
  deleteBySurvey(surveyId: UniqueEntityID): Promise<void>;
}
