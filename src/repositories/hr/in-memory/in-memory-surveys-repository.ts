import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Survey } from '@/entities/hr/survey';
import type {
  CreateSurveySchema,
  FindSurveyFilters,
  SurveysRepository,
  UpdateSurveySchema,
} from '../surveys-repository';

export class InMemorySurveysRepository implements SurveysRepository {
  public items: Survey[] = [];

  async create(data: CreateSurveySchema): Promise<Survey> {
    const survey = Survey.create({
      tenantId: new UniqueEntityID(data.tenantId),
      title: data.title,
      description: data.description,
      type: data.type,
      status: data.status ?? 'DRAFT',
      isAnonymous: data.isAnonymous ?? false,
      startDate: data.startDate,
      endDate: data.endDate,
      createdBy: data.createdBy,
    });

    this.items.push(survey);
    return survey;
  }

  async findById(id: UniqueEntityID, tenantId: string): Promise<Survey | null> {
    return (
      this.items.find(
        (survey) =>
          survey.id.equals(id) && survey.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindSurveyFilters,
  ): Promise<{ surveys: Survey[]; total: number }> {
    let filtered = this.items.filter(
      (survey) => survey.tenantId.toString() === tenantId,
    );

    if (filters?.type) {
      filtered = filtered.filter((survey) => survey.type === filters.type);
    }
    if (filters?.status) {
      filtered = filtered.filter((survey) => survey.status === filters.status);
    }
    if (filters?.createdBy) {
      filtered = filtered.filter((survey) =>
        survey.createdBy.equals(filters.createdBy!),
      );
    }

    const total = filtered.length;
    const sorted = filtered.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 20, 100);

    return {
      surveys: sorted.slice((page - 1) * perPage, page * perPage),
      total,
    };
  }

  async update(data: UpdateSurveySchema): Promise<Survey | null> {
    const index = this.items.findIndex((survey) => survey.id.equals(data.id));
    if (index === -1) return null;

    const survey = this.items[index];

    if (data.title !== undefined) survey.props.title = data.title;
    if (data.description !== undefined)
      survey.props.description = data.description;
    if (data.type !== undefined) survey.props.type = data.type;
    if (data.status !== undefined) survey.props.status = data.status;
    if (data.isAnonymous !== undefined)
      survey.props.isAnonymous = data.isAnonymous;
    if (data.startDate !== undefined) survey.props.startDate = data.startDate;
    if (data.endDate !== undefined) survey.props.endDate = data.endDate;
    survey.props.updatedAt = new Date();

    return survey;
  }

  async delete(id: UniqueEntityID, _tenantId?: string): Promise<void> {
    const index = this.items.findIndex((survey) => survey.id.equals(id));
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }
}
