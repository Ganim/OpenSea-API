import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { SurveyQuestion } from '@/entities/hr/survey-question';
import type {
  CreateSurveyQuestionSchema,
  SurveyQuestionsRepository,
  UpdateSurveyQuestionSchema,
} from '../survey-questions-repository';

export class InMemorySurveyQuestionsRepository
  implements SurveyQuestionsRepository
{
  public items: SurveyQuestion[] = [];

  async create(data: CreateSurveyQuestionSchema): Promise<SurveyQuestion> {
    const question = SurveyQuestion.create({
      tenantId: new UniqueEntityID(data.tenantId),
      surveyId: data.surveyId,
      text: data.text,
      type: data.type,
      options: data.options,
      order: data.order,
      isRequired: data.isRequired ?? true,
      category: data.category,
    });

    this.items.push(question);
    return question;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<SurveyQuestion | null> {
    return (
      this.items.find(
        (q) => q.id.equals(id) && q.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findBySurvey(
    surveyId: UniqueEntityID,
    tenantId: string,
  ): Promise<SurveyQuestion[]> {
    return this.items
      .filter(
        (q) =>
          q.surveyId.equals(surveyId) && q.tenantId.toString() === tenantId,
      )
      .sort((a, b) => a.order - b.order);
  }

  async update(
    data: UpdateSurveyQuestionSchema,
  ): Promise<SurveyQuestion | null> {
    const index = this.items.findIndex((q) => q.id.equals(data.id));
    if (index === -1) return null;

    const question = this.items[index];
    if (data.text !== undefined) question.props.text = data.text;
    if (data.type !== undefined) question.props.type = data.type;
    if (data.options !== undefined) question.props.options = data.options;
    if (data.order !== undefined) question.props.order = data.order;
    if (data.isRequired !== undefined)
      question.props.isRequired = data.isRequired;
    if (data.category !== undefined) question.props.category = data.category;
    question.props.updatedAt = new Date();

    return question;
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    const index = this.items.findIndex((q) => q.id.equals(id));
    if (index >= 0) this.items.splice(index, 1);
  }

  async deleteBySurvey(surveyId: UniqueEntityID): Promise<void> {
    this.items = this.items.filter((q) => !q.surveyId.equals(surveyId));
  }
}
