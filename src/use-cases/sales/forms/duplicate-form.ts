import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { formFieldToDTO } from '@/mappers/sales/form/form-field-to-dto';
import type { FormDTO } from '@/mappers/sales/form/form-to-dto';
import { formToDTO } from '@/mappers/sales/form/form-to-dto';
import type { FormFieldsRepository } from '@/repositories/sales/form-fields-repository';
import type { FormsRepository } from '@/repositories/sales/forms-repository';

interface DuplicateFormUseCaseRequest {
  tenantId: string;
  formId: string;
  createdBy: string;
}

interface DuplicateFormUseCaseResponse {
  form: FormDTO;
}

export class DuplicateFormUseCase {
  constructor(
    private formsRepository: FormsRepository,
    private formFieldsRepository: FormFieldsRepository,
  ) {}

  async execute(
    input: DuplicateFormUseCaseRequest,
  ): Promise<DuplicateFormUseCaseResponse> {
    const originalForm = await this.formsRepository.findById(
      new UniqueEntityID(input.formId),
      input.tenantId,
    );

    if (!originalForm) {
      throw new ResourceNotFoundError('Form not found.');
    }

    const duplicatedForm = await this.formsRepository.create({
      tenantId: input.tenantId,
      title: `${originalForm.title} (Copy)`,
      description: originalForm.description,
      createdBy: input.createdBy,
    });

    const originalFields = await this.formFieldsRepository.findByFormId(
      originalForm.id,
    );

    const fieldsToCreate = originalFields.map((field) => ({
      formId: duplicatedForm.id.toString(),
      label: field.label,
      type: field.type,
      options: field.options,
      isRequired: field.isRequired,
      order: field.order,
    }));

    const createdFields =
      await this.formFieldsRepository.createMany(fieldsToCreate);
    const fieldDTOs = createdFields.map(formFieldToDTO);

    return {
      form: formToDTO(duplicatedForm, fieldDTOs),
    };
  }
}
