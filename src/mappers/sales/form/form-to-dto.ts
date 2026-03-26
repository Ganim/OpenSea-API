import type { Form } from '@/entities/sales/form';
import type { FormFieldDTO } from './form-field-to-dto';

export interface FormDTO {
  id: string;
  title: string;
  description?: string;
  status: string;
  submissionCount: number;
  createdBy: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  fields?: FormFieldDTO[];
}

export function formToDTO(form: Form, fields?: FormFieldDTO[]): FormDTO {
  const dto: FormDTO = {
    id: form.id.toString(),
    title: form.title,
    status: form.status,
    submissionCount: form.submissionCount,
    createdBy: form.createdBy,
    isActive: form.isActive,
    createdAt: form.createdAt,
  };

  if (form.description) dto.description = form.description;
  if (form.updatedAt) dto.updatedAt = form.updatedAt;
  if (fields) dto.fields = fields;

  return dto;
}
