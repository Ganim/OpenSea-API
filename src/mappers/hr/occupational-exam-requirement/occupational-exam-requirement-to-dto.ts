import type { OccupationalExamRequirement } from '@/entities/hr/occupational-exam-requirement';

export interface OccupationalExamRequirementDTO {
  id: string;
  tenantId: string;
  positionId: string | null;
  examType: string;
  examCategory: string;
  frequencyMonths: number;
  isMandatory: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export function occupationalExamRequirementToDTO(
  requirement: OccupationalExamRequirement,
): OccupationalExamRequirementDTO {
  return {
    id: requirement.id.toString(),
    tenantId: requirement.tenantId.toString(),
    positionId: requirement.positionId?.toString() ?? null,
    examType: requirement.examType,
    examCategory: requirement.examCategory,
    frequencyMonths: requirement.frequencyMonths,
    isMandatory: requirement.isMandatory,
    description: requirement.description ?? null,
    createdAt: requirement.createdAt.toISOString(),
    updatedAt: requirement.updatedAt.toISOString(),
  };
}
