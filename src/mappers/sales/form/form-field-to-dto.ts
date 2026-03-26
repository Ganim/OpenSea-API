import type { FormField } from '@/entities/sales/form-field';

export interface FormFieldDTO {
  id: string;
  formId: string;
  label: string;
  type: string;
  options?: Record<string, unknown>;
  isRequired: boolean;
  order: number;
  createdAt: Date;
}

export function formFieldToDTO(field: FormField): FormFieldDTO {
  const dto: FormFieldDTO = {
    id: field.id.toString(),
    formId: field.formId.toString(),
    label: field.label,
    type: field.type,
    isRequired: field.isRequired,
    order: field.order,
    createdAt: field.createdAt,
  };

  if (field.options) dto.options = field.options;

  return dto;
}
