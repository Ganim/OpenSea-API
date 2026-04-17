import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { SurveyResponse } from '@/entities/hr/survey-response';
import type {
  CreateSurveyResponseSchema,
  FindSurveyResponseFilters,
  SurveyResponsesRepository,
} from '../survey-responses-repository';

export class InMemorySurveyResponsesRepository
  implements SurveyResponsesRepository
{
  public items: SurveyResponse[] = [];

  async create(data: CreateSurveyResponseSchema): Promise<SurveyResponse> {
    const response = SurveyResponse.create({
      tenantId: new UniqueEntityID(data.tenantId),
      surveyId: data.surveyId,
      employeeId: data.employeeId,
      respondentHash: data.respondentHash,
    });

    this.items.push(response);
    return response;
  }

  async findByRespondentHash(
    surveyId: UniqueEntityID,
    respondentHash: string,
    tenantId: string,
  ): Promise<SurveyResponse | null> {
    return (
      this.items.find(
        (response) =>
          response.surveyId.equals(surveyId) &&
          response.respondentHash === respondentHash &&
          response.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<SurveyResponse | null> {
    return (
      this.items.find(
        (r) => r.id.equals(id) && r.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindSurveyResponseFilters,
  ): Promise<{ responses: SurveyResponse[]; total: number }> {
    let filtered = this.items.filter((r) => r.tenantId.toString() === tenantId);

    if (filters?.surveyId) {
      filtered = filtered.filter((r) => r.surveyId.equals(filters.surveyId!));
    }
    if (filters?.employeeId) {
      filtered = filtered.filter(
        (r) =>
          r.employeeId !== undefined &&
          r.employeeId.equals(filters.employeeId!),
      );
    }

    const total = filtered.length;
    const sorted = filtered.sort(
      (a, b) => b.submittedAt.getTime() - a.submittedAt.getTime(),
    );
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 20, 100);

    return {
      responses: sorted.slice((page - 1) * perPage, page * perPage),
      total,
    };
  }

  async findByEmployeeAndSurvey(
    employeeId: UniqueEntityID,
    surveyId: UniqueEntityID,
    tenantId: string,
  ): Promise<SurveyResponse | null> {
    return (
      this.items.find(
        (r) =>
          r.employeeId !== undefined &&
          r.employeeId.equals(employeeId) &&
          r.surveyId.equals(surveyId) &&
          r.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async countBySurvey(
    surveyId: UniqueEntityID,
    tenantId: string,
  ): Promise<number> {
    return this.items.filter(
      (r) => r.surveyId.equals(surveyId) && r.tenantId.toString() === tenantId,
    ).length;
  }
}
