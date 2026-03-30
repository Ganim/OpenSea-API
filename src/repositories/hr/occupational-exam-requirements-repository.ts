import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OccupationalExamRequirement } from '@/entities/hr/occupational-exam-requirement';
import type { MedicalExamType } from '@/entities/hr/medical-exam';

export interface CreateOccupationalExamRequirementSchema {
  tenantId: string;
  positionId?: string;
  examType: string;
  examCategory: MedicalExamType;
  frequencyMonths: number;
  isMandatory?: boolean;
  description?: string;
}

export interface FindOccupationalExamRequirementFilters {
  positionId?: string;
  examCategory?: string;
  page?: number;
  perPage?: number;
}

export interface OccupationalExamRequirementsRepository {
  create(
    data: CreateOccupationalExamRequirementSchema,
  ): Promise<OccupationalExamRequirement>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<OccupationalExamRequirement | null>;
  findMany(
    tenantId: string,
    filters?: FindOccupationalExamRequirementFilters,
  ): Promise<OccupationalExamRequirement[]>;
  findByPositionId(
    positionId: UniqueEntityID,
    tenantId: string,
  ): Promise<OccupationalExamRequirement[]>;
  delete(id: UniqueEntityID): Promise<void>;
}
