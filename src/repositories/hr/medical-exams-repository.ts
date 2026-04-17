import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { MedicalExam } from '@/entities/hr/medical-exam';

export interface CreateMedicalExamSchema {
  tenantId: string;
  employeeId: UniqueEntityID;
  type: string;
  examDate: Date;
  expirationDate?: Date;
  doctorName: string;
  doctorCrm: string;
  result: string;
  observations?: string;
  documentUrl?: string;
  // PCMSO fields
  examCategory?: string;
  validityMonths?: number;
  clinicName?: string;
  clinicAddress?: string;
  physicianName?: string;
  physicianCRM?: string;
  aptitude?: string;
  restrictions?: string;
  nextExamDate?: Date;
}

export interface UpdateMedicalExamSchema {
  id: UniqueEntityID;
  /**
   * Tenant identifier for multi-tenant write isolation. Optional for backward
   * compatibility during the defense-in-depth rollout, but callers MUST pass
   * it so the underlying Prisma `where` clause is scoped and cannot update a
   * record belonging to another tenant.
   */
  tenantId?: string;
  type?: string;
  examDate?: Date;
  expirationDate?: Date;
  doctorName?: string;
  doctorCrm?: string;
  result?: string;
  observations?: string;
  documentUrl?: string;
  // PCMSO fields
  examCategory?: string;
  validityMonths?: number;
  clinicName?: string;
  clinicAddress?: string;
  physicianName?: string;
  physicianCRM?: string;
  aptitude?: string;
  restrictions?: string;
  nextExamDate?: Date;
}

export interface FindMedicalExamFilters {
  employeeId?: UniqueEntityID;
  type?: string;
  result?: string;
  aptitude?: string;
  status?: 'VALID' | 'EXPIRING' | 'EXPIRED';
  page?: number;
  perPage?: number;
}

export interface MedicalExamsRepository {
  create(data: CreateMedicalExamSchema): Promise<MedicalExam>;
  findById(id: UniqueEntityID, tenantId: string): Promise<MedicalExam | null>;
  findByEmployeeId(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<MedicalExam[]>;
  findMany(
    tenantId: string,
    filters?: FindMedicalExamFilters,
  ): Promise<MedicalExam[]>;
  findExpiring(tenantId: string, daysThreshold: number): Promise<MedicalExam[]>;
  findOverdue(tenantId: string): Promise<MedicalExam[]>;
  update(data: UpdateMedicalExamSchema): Promise<MedicalExam | null>;

  /**
   * Soft-deletes an ASO (P0-02 / NR-7 item 7.4.4.3). The record remains in
   * the database with `deletedAt` set, and every read path filters it out
   * automatically. Use this for every user-initiated delete — NR-7 requires
   * the ASO to be retained for at least 20 years after the employee leaves.
   */
  softDelete(id: UniqueEntityID, tenantId: string): Promise<void>;

  /**
   * Physical delete — RESTRICTED. Bypasses the NR-7 20-year retention
   * guarantee, so callers must prove the retention period has elapsed or
   * that this is a GDPR/LGPD Art. 18 erasure request. Only `HR.MEDICAL_EXAMS.ADMIN`
   * should reach this method; regular "remove" actions MUST use `softDelete`.
   */
  hardDelete(id: UniqueEntityID, tenantId?: string): Promise<void>;
}
