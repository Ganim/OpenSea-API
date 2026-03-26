import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { formFieldToDTO } from '@/mappers/sales/form/form-field-to-dto';
import type { FormDTO } from '@/mappers/sales/form/form-to-dto';
import { formToDTO } from '@/mappers/sales/form/form-to-dto';
import type { FormFieldsRepository } from '@/repositories/sales/form-fields-repository';
import type { FormsRepository } from '@/repositories/sales/forms-repository';

interface GetFormByIdUseCaseRequest {
  tenantId: string;
  formId: string;
}

interface GetFormByIdUseCaseResponse {
  form: FormDTO;
}

export class GetFormByIdUseCase {
  constructor(
    private formsRepository: FormsRepository,
    private formFieldsRepository: FormFieldsRepository,
  ) {}

  async execute(
    input: GetFormByIdUseCaseRequest,
  ): Promise<GetFormByIdUseCaseResponse> {
    const form = await this.formsRepository.findById(
      new UniqueEntityID(input.formId),
      input.tenantId,
    );

    if (!form) {
      throw new ResourceNotFoundError('Form not found.');
    }

    const fields = await this.formFieldsRepository.findByFormId(form.id);
    const fieldDTOs = fields.map(formFieldToDTO);

    return {
      form: formToDTO(form, fieldDTOs),
    };
  }
}
