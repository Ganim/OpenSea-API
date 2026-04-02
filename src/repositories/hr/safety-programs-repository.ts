import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SafetyProgram } from '@/entities/hr/safety-program';

export interface CreateSafetyProgramSchema {
  tenantId: string;
  type: string;
  name: string;
  validFrom: Date;
  validUntil: Date;
  responsibleName: string;
  responsibleRegistration: string;
  documentUrl?: string;
  status?: string;
  notes?: string;
}

export interface UpdateSafetyProgramSchema {
  id: UniqueEntityID;
  type?: string;
  name?: string;
  validFrom?: Date;
  validUntil?: Date;
  responsibleName?: string;
  responsibleRegistration?: string;
  documentUrl?: string;
  status?: string;
  notes?: string;
}

export interface FindSafetyProgramFilters {
  type?: string;
  status?: string;
  page?: number;
  perPage?: number;
}

export interface SafetyProgramsRepository {
  create(data: CreateSafetyProgramSchema): Promise<SafetyProgram>;
  findById(id: UniqueEntityID, tenantId: string): Promise<SafetyProgram | null>;
  findMany(
    tenantId: string,
    filters?: FindSafetyProgramFilters,
  ): Promise<SafetyProgram[]>;
  update(data: UpdateSafetyProgramSchema): Promise<SafetyProgram | null>;
  delete(id: UniqueEntityID): Promise<void>;
}
