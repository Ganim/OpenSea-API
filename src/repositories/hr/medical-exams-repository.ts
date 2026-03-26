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
}

export interface UpdateMedicalExamSchema {
  id: UniqueEntityID;
  type?: string;
  examDate?: Date;
  expirationDate?: Date;
  doctorName?: string;
  doctorCrm?: string;
  result?: string;
  observations?: string;
  documentUrl?: string;
}

export interface FindMedicalExamFilters {
  employeeId?: UniqueEntityID;
  type?: string;
  result?: string;
  page?: number;
  perPage?: number;
}

export interface MedicalExamsRepository {
  create(data: CreateMedicalExamSchema): Promise<MedicalExam>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<MedicalExam | null>;
  findByEmployeeId(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<MedicalExam[]>;
  findMany(
    tenantId: string,
    filters?: FindMedicalExamFilters,
  ): Promise<MedicalExam[]>;
  update(data: UpdateMedicalExamSchema): Promise<MedicalExam | null>;
  delete(id: UniqueEntityID): Promise<void>;
}
