import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TrainingProgram } from '@/entities/hr/training-program';

export interface CreateTrainingProgramSchema {
  tenantId: string;
  name: string;
  description?: string;
  category: string;
  format: string;
  durationHours: number;
  instructor?: string;
  maxParticipants?: number;
  isActive?: boolean;
  isMandatory?: boolean;
  validityMonths?: number;
}

export interface UpdateTrainingProgramSchema {
  id: UniqueEntityID;
  name?: string;
  description?: string;
  category?: string;
  format?: string;
  durationHours?: number;
  instructor?: string;
  maxParticipants?: number;
  isActive?: boolean;
  isMandatory?: boolean;
  validityMonths?: number;
}

export interface FindTrainingProgramFilters {
  category?: string;
  format?: string;
  isActive?: boolean;
  isMandatory?: boolean;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface TrainingProgramsRepository {
  create(data: CreateTrainingProgramSchema): Promise<TrainingProgram>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<TrainingProgram | null>;
  findMany(
    tenantId: string,
    filters?: FindTrainingProgramFilters,
  ): Promise<{ trainingPrograms: TrainingProgram[]; total: number }>;
  update(data: UpdateTrainingProgramSchema): Promise<TrainingProgram | null>;
  delete(id: UniqueEntityID): Promise<void>;
}
