import type { Survey } from '@/entities/hr/survey';

export interface SurveyDTO {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  isAnonymous: boolean;
  startDate: string;
  endDate: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export function surveyToDTO(survey: Survey): SurveyDTO {
  return {
    id: survey.id.toString(),
    title: survey.title,
    description: survey.description ?? null,
    type: survey.type,
    status: survey.status,
    isAnonymous: survey.isAnonymous,
    startDate: survey.startDate.toISOString(),
    endDate: survey.endDate.toISOString(),
    createdBy: survey.createdBy.toString(),
    createdAt: survey.createdAt.toISOString(),
    updatedAt: survey.updatedAt.toISOString(),
  };
}
