import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FormSubmission } from '@/entities/sales/form-submission';

export interface CreateFormSubmissionSchema {
  formId: string;
  data: Record<string, unknown>;
  submittedBy?: string;
}

export interface FormSubmissionsRepository {
  create(data: CreateFormSubmissionSchema): Promise<FormSubmission>;
  findByFormId(formId: UniqueEntityID, page: number, perPage: number): Promise<FormSubmission[]>;
  countByFormId(formId: UniqueEntityID): Promise<number>;
}
