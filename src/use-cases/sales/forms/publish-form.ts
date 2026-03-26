import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FormDTO } from '@/mappers/sales/form/form-to-dto';
import { formToDTO } from '@/mappers/sales/form/form-to-dto';
import type { FormsRepository } from '@/repositories/sales/forms-repository';

interface PublishFormUseCaseRequest {
  tenantId: string;
  formId: string;
}

interface PublishFormUseCaseResponse {
  form: FormDTO;
}

export class PublishFormUseCase {
  constructor(private formsRepository: FormsRepository) {}

  async execute(
    input: PublishFormUseCaseRequest,
  ): Promise<PublishFormUseCaseResponse> {
    const form = await this.formsRepository.findById(
      new UniqueEntityID(input.formId),
      input.tenantId,
    );

    if (!form) {
      throw new ResourceNotFoundError('Form not found.');
    }

    if (form.status !== 'DRAFT') {
      throw new BadRequestError(
        'Only draft forms can be published.',
      );
    }

    form.publish();
    await this.formsRepository.save(form);

    return {
      form: formToDTO(form),
    };
  }
}
