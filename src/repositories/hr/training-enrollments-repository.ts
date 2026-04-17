import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TrainingEnrollment } from '@/entities/hr/training-enrollment';

export interface CreateTrainingEnrollmentSchema {
  tenantId: string;
  trainingProgramId: UniqueEntityID;
  employeeId: UniqueEntityID;
  status?: string;
  notes?: string;
}

export interface UpdateTrainingEnrollmentSchema {
  id: UniqueEntityID;
  /**
   * Tenant identifier for multi-tenant write isolation. Optional for backward
   * compatibility during the defense-in-depth rollout, but callers MUST pass
   * it so the underlying Prisma `where` clause is scoped and cannot update a
   * record belonging to another tenant.
   */
  tenantId?: string;
  status?: string;
  startedAt?: Date;
  completedAt?: Date;
  score?: number;
  certificateUrl?: string;
  notes?: string;
}

export interface FindTrainingEnrollmentFilters {
  trainingProgramId?: UniqueEntityID;
  employeeId?: UniqueEntityID;
  status?: string;
  page?: number;
  perPage?: number;
}

export interface TrainingEnrollmentsRepository {
  create(data: CreateTrainingEnrollmentSchema): Promise<TrainingEnrollment>;
  bulkCreate(
    enrollments: CreateTrainingEnrollmentSchema[],
  ): Promise<TrainingEnrollment[]>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<TrainingEnrollment | null>;
  findMany(
    tenantId: string,
    filters?: FindTrainingEnrollmentFilters,
  ): Promise<{ enrollments: TrainingEnrollment[]; total: number }>;
  findByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<TrainingEnrollment[]>;
  findByProgramAndEmployee(
    trainingProgramId: UniqueEntityID,
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<TrainingEnrollment | null>;
  update(
    data: UpdateTrainingEnrollmentSchema,
  ): Promise<TrainingEnrollment | null>;
  delete(id: UniqueEntityID, tenantId?: string): Promise<void>;
}
