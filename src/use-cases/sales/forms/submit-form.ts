import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FormSubmissionDTO } from '@/mappers/sales/form/form-submission-to-dto';
import { formSubmissionToDTO } from '@/mappers/sales/form/form-submission-to-dto';
import type { FormSubmissionsRepository } from '@/repositories/sales/form-submissions-repository';
import type { FormsRepository } from '@/repositories/sales/forms-repository';

interface SubmitFormUseCaseRequest {
  tenantId: string;
  formId: string;
  data: Record<string, unknown>;
  submittedBy?: string;
}

interface SubmitFormUseCaseResponse {
  submission: FormSubmissionDTO;
}

export class SubmitFormUseCase {
  constructor(
    private formsRepository: FormsRepository,
    private formSubmissionsRepository: FormSubmissionsRepository,
  ) {}

  async execute(
    input: SubmitFormUseCaseRequest,
  ): Promise<SubmitFormUseCaseResponse> {
    const form = await this.formsRepository.findById(
      new UniqueEntityID(input.formId),
      input.tenantId,
    );

    if (!form) {
      throw new ResourceNotFoundError('Form not found.');
    }

    if (form.status !== 'PUBLISHED') {
      throw new BadRequestError(
        'Submissions are only accepted for published forms.',
      );
    }

    const submission = await this.formSubmissionsRepository.create({
      formId: input.formId,
      data: input.data,
      submittedBy: input.submittedBy,
    });

    form.incrementSubmissions();
    await this.formsRepository.save(form);

    return {
      submission: formSubmissionToDTO(submission),
    };
  }
}
