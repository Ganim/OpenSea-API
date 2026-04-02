import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { formFieldToDTO } from '@/mappers/sales/form/form-field-to-dto';
import type { FormDTO } from '@/mappers/sales/form/form-to-dto';
import { formToDTO } from '@/mappers/sales/form/form-to-dto';
import type { FormFieldsRepository } from '@/repositories/sales/form-fields-repository';
import type { FormsRepository } from '@/repositories/sales/forms-repository';

interface UpdateFormFieldInput {
  label: string;
  type: string;
  options?: Record<string, unknown>;
  isRequired?: boolean;
  order: number;
}

interface UpdateFormUseCaseRequest {
  tenantId: string;
  formId: string;
  title?: string;
  description?: string;
  fields?: UpdateFormFieldInput[];
}

interface UpdateFormUseCaseResponse {
  form: FormDTO;
}

export class UpdateFormUseCase {
  constructor(
    private formsRepository: FormsRepository,
    private formFieldsRepository: FormFieldsRepository,
  ) {}

  async execute(
    input: UpdateFormUseCaseRequest,
  ): Promise<UpdateFormUseCaseResponse> {
    const form = await this.formsRepository.findById(
      new UniqueEntityID(input.formId),
      input.tenantId,
    );

    if (!form) {
      throw new ResourceNotFoundError('Form not found.');
    }

    if (form.status !== 'DRAFT') {
      throw new BadRequestError('Only draft forms can be updated.');
    }

    if (input.title !== undefined) {
      if (input.title.trim().length === 0) {
        throw new BadRequestError('Form title is required.');
      }
      if (input.title.length > 255) {
        throw new BadRequestError('Form title cannot exceed 255 characters.');
      }
      form.title = input.title.trim();
    }

    if (input.description !== undefined) {
      form.description = input.description?.trim();
    }

    await this.formsRepository.save(form);

    if (input.fields) {
      await this.formFieldsRepository.deleteByFormId(form.id);
      const fieldsToCreate = input.fields.map((field) => ({
        formId: form.id.toString(),
        label: field.label,
        type: field.type,
        options: field.options,
        isRequired: field.isRequired,
        order: field.order,
      }));
      await this.formFieldsRepository.createMany(fieldsToCreate);
    }

    const fields = await this.formFieldsRepository.findByFormId(form.id);
    const fieldDTOs = fields.map(formFieldToDTO);

    return {
      form: formToDTO(form, fieldDTOs),
    };
  }
}
