import type { SurveyResponse } from '@/entities/hr/survey-response';

export interface SurveyResponseDTO {
  id: string;
  surveyId: string;
  employeeId: string | null;
  submittedAt: string;
  createdAt: string;
}

export function surveyResponseToDTO(
  response: SurveyResponse,
): SurveyResponseDTO {
  return {
    id: response.id.toString(),
    surveyId: response.surveyId.toString(),
    employeeId: response.employeeId?.toString() ?? null,
    submittedAt: response.submittedAt.toISOString(),
    createdAt: response.createdAt.toISOString(),
  };
}
