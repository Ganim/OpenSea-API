import type { FormSubmission } from '@/entities/sales/form-submission';

export interface FormSubmissionDTO {
  id: string;
  formId: string;
  data: Record<string, unknown>;
  submittedBy?: string;
  createdAt: Date;
}

export function formSubmissionToDTO(
  submission: FormSubmission,
): FormSubmissionDTO {
  const dto: FormSubmissionDTO = {
    id: submission.id.toString(),
    formId: submission.formId.toString(),
    data: submission.data,
    createdAt: submission.createdAt,
  };

  if (submission.submittedBy) dto.submittedBy = submission.submittedBy;

  return dto;
}
