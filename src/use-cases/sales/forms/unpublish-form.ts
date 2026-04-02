import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FormDTO } from '@/mappers/sales/form/form-to-dto';
import { formToDTO } from '@/mappers/sales/form/form-to-dto';
import type { FormsRepository } from '@/repositories/sales/forms-repository';

interface UnpublishFormUseCaseRequest {
  tenantId: string;
  formId: string;
}

interface UnpublishFormUseCaseResponse {
  form: FormDTO;
}

export class UnpublishFormUseCase {
  constructor(private formsRepository: FormsRepository) {}

  async execute(
    input: UnpublishFormUseCaseRequest,
  ): Promise<UnpublishFormUseCaseResponse> {
    const form = await this.formsRepository.findById(
      new UniqueEntityID(input.formId),
      input.tenantId,
    );

    if (!form) {
      throw new ResourceNotFoundError('Form not found.');
    }

    if (form.status !== 'PUBLISHED') {
      throw new BadRequestError('Only published forms can be unpublished.');
    }

    form.unpublish();
    await this.formsRepository.save(form);

    return {
      form: formToDTO(form),
    };
  }
}
