import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FormSubmissionDTO } from '@/mappers/sales/form/form-submission-to-dto';
import { formSubmissionToDTO } from '@/mappers/sales/form/form-submission-to-dto';
import type { FormSubmissionsRepository } from '@/repositories/sales/form-submissions-repository';
import type { FormsRepository } from '@/repositories/sales/forms-repository';

interface ListSubmissionsUseCaseRequest {
  tenantId: string;
  formId: string;
  page?: number;
  perPage?: number;
}

interface ListSubmissionsUseCaseResponse {
  submissions: FormSubmissionDTO[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export class ListSubmissionsUseCase {
  constructor(
    private formsRepository: FormsRepository,
    private formSubmissionsRepository: FormSubmissionsRepository,
  ) {}

  async execute(
    input: ListSubmissionsUseCaseRequest,
  ): Promise<ListSubmissionsUseCaseResponse> {
    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;

    const form = await this.formsRepository.findById(
      new UniqueEntityID(input.formId),
      input.tenantId,
    );

    if (!form) {
      throw new ResourceNotFoundError('Form not found.');
    }

    const formId = new UniqueEntityID(input.formId);
    const [submissions, total] = await Promise.all([
      this.formSubmissionsRepository.findByFormId(formId, page, perPage),
      this.formSubmissionsRepository.countByFormId(formId),
    ]);

    return {
      submissions: submissions.map(formSubmissionToDTO),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }
}
