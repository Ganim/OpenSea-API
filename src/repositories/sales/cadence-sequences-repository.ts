import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  CadenceEnrollmentProps,
  CadenceEnrollmentStatus,
  CadenceSequence,
} from '@/entities/sales/cadence-sequence';

export interface CreateCadenceStepSchema {
  order: number;
  type: string;
  delayDays: number;
  config: Record<string, unknown>;
}

export interface CreateCadenceSequenceSchema {
  tenantId: string;
  name: string;
  description?: string;
  createdBy: string;
  steps: CreateCadenceStepSchema[];
}

export interface UpdateCadenceSequenceSchema {
  id: UniqueEntityID;
  tenantId: string;
  name?: string;
  description?: string | null;
  steps?: CreateCadenceStepSchema[];
}

export interface CreateCadenceEnrollmentSchema {
  sequenceId: string;
  tenantId: string;
  contactId?: string;
  dealId?: string;
  currentStepOrder: number;
  status: CadenceEnrollmentStatus;
  nextActionAt?: Date;
}

export interface CadenceSequencesRepository {
  create(data: CreateCadenceSequenceSchema): Promise<CadenceSequence>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<CadenceSequence | null>;
  findMany(
    page: number,
    perPage: number,
    tenantId: string,
    filters?: { isActive?: boolean; search?: string },
  ): Promise<CadenceSequence[]>;
  countMany(
    tenantId: string,
    filters?: { isActive?: boolean; search?: string },
  ): Promise<number>;
  save(cadenceSequence: CadenceSequence): Promise<void>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
  createEnrollment(
    data: CreateCadenceEnrollmentSchema,
  ): Promise<CadenceEnrollmentProps>;
  findEnrollmentById(
    id: string,
    tenantId: string,
  ): Promise<CadenceEnrollmentProps | null>;
  saveEnrollment(enrollment: CadenceEnrollmentProps): Promise<void>;
  findPendingEnrollments(
    tenantId: string,
    now: Date,
  ): Promise<CadenceEnrollmentProps[]>;
}
