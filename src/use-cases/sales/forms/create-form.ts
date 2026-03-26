import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { formFieldToDTO } from '@/mappers/sales/form/form-field-to-dto';
import type { FormDTO } from '@/mappers/sales/form/form-to-dto';
import { formToDTO } from '@/mappers/sales/form/form-to-dto';
import type { FormFieldsRepository } from '@/repositories/sales/form-fields-repository';
import type { FormsRepository } from '@/repositories/sales/forms-repository';

interface CreateFormFieldInput {
  label: string;
  type: string;
  options?: Record<string, unknown>;
  isRequired?: boolean;
  order: number;
}

interface CreateFormUseCaseRequest {
  tenantId: string;
  title: string;
  description?: string;
  createdBy: string;
  fields: CreateFormFieldInput[];
}

interface CreateFormUseCaseResponse {
  form: FormDTO;
}

export class CreateFormUseCase {
  constructor(
    private formsRepository: FormsRepository,
    private formFieldsRepository: FormFieldsRepository,
  ) {}

  async execute(
    input: CreateFormUseCaseRequest,
  ): Promise<CreateFormUseCaseResponse> {
    if (!input.title || input.title.trim().length === 0) {
      throw new BadRequestError('Form title is required.');
    }

    if (input.title.length > 255) {
      throw new BadRequestError(
        'Form title cannot exceed 255 characters.',
      );
    }

    if (!input.fields || input.fields.length === 0) {
      throw new BadRequestError(
        'Form must have at least one field.',
      );
    }

    const form = await this.formsRepository.create({
      tenantId: input.tenantId,
      title: input.title.trim(),
      description: input.description?.trim(),
      createdBy: input.createdBy,
    });

    const fieldsToCreate = input.fields.map((field) => ({
      formId: form.id.toString(),
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
      form: formToDTO(form, fieldDTOs),
    };
  }
}
