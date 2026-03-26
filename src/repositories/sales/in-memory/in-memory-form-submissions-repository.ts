import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FormSubmission } from '@/entities/sales/form-submission';
import type {
  CreateFormSubmissionSchema,
  FormSubmissionsRepository,
} from '../form-submissions-repository';

export class InMemoryFormSubmissionsRepository
  implements FormSubmissionsRepository
{
  public items: FormSubmission[] = [];

  async create(data: CreateFormSubmissionSchema): Promise<FormSubmission> {
    const submission = FormSubmission.create({
      formId: new UniqueEntityID(data.formId),
      data: data.data,
      submittedBy: data.submittedBy,
    });

    this.items.push(submission);
    return submission;
  }

  async findByFormId(
    formId: UniqueEntityID,
    page: number,
    perPage: number,
  ): Promise<FormSubmission[]> {
    const start = (page - 1) * perPage;
    return this.items
      .filter((item) => item.formId.equals(formId))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(start, start + perPage);
  }

  async countByFormId(formId: UniqueEntityID): Promise<number> {
    return this.items.filter((item) => item.formId.equals(formId)).length;
  }
}
