import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { MedicalExam } from '@/entities/hr/medical-exam';
import type {
  CreateMedicalExamSchema,
  FindMedicalExamFilters,
  MedicalExamsRepository,
  UpdateMedicalExamSchema,
} from '../medical-exams-repository';

export class InMemoryMedicalExamsRepository implements MedicalExamsRepository {
  private items: MedicalExam[] = [];

  async create(data: CreateMedicalExamSchema): Promise<MedicalExam> {
    const id = new UniqueEntityID();
    const medicalExam = MedicalExam.create(
      {
        tenantId: new UniqueEntityID(data.tenantId),
        employeeId: data.employeeId,
        type: data.type as MedicalExam['type'],
        examDate: data.examDate,
        expirationDate: data.expirationDate,
        doctorName: data.doctorName,
        doctorCrm: data.doctorCrm,
        result: data.result as MedicalExam['result'],
        observations: data.observations,
        documentUrl: data.documentUrl,
      },
      id,
    );

    this.items.push(medicalExam);
    return medicalExam;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<MedicalExam | null> {
    const medicalExam = this.items.find(
      (item) => item.id.equals(id) && item.tenantId.toString() === tenantId,
    );
    return medicalExam || null;
  }

  async findByEmployeeId(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<MedicalExam[]> {
    return this.items.filter(
      (item) =>
        item.employeeId.equals(employeeId) &&
        item.tenantId.toString() === tenantId,
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindMedicalExamFilters,
  ): Promise<MedicalExam[]> {
    let filteredItems = this.items.filter(
      (item) => item.tenantId.toString() === tenantId,
    );

    if (filters?.employeeId) {
      filteredItems = filteredItems.filter((item) =>
        item.employeeId.equals(filters.employeeId!),
      );
    }

    if (filters?.type) {
      filteredItems = filteredItems.filter(
        (item) => item.type === filters.type,
      );
    }

    if (filters?.result) {
      filteredItems = filteredItems.filter(
        (item) => item.result === filters.result,
      );
    }

    const page = filters?.page ?? 1;
    const perPage = filters?.perPage ?? 20;
    const start = (page - 1) * perPage;

    return filteredItems.slice(start, start + perPage);
  }

  async update(data: UpdateMedicalExamSchema): Promise<MedicalExam | null> {
    const index = this.items.findIndex((item) => item.id.equals(data.id));

    if (index === -1) return null;

    const existing = this.items[index];

    const updatedExam = MedicalExam.create(
      {
        tenantId: existing.tenantId,
        employeeId: existing.employeeId,
        type: (data.type as MedicalExam['type']) ?? existing.type,
        examDate: data.examDate ?? existing.examDate,
        expirationDate: data.expirationDate ?? existing.expirationDate,
        doctorName: data.doctorName ?? existing.doctorName,
        doctorCrm: data.doctorCrm ?? existing.doctorCrm,
        result: (data.result as MedicalExam['result']) ?? existing.result,
        observations: data.observations ?? existing.observations,
        documentUrl: data.documentUrl ?? existing.documentUrl,
        createdAt: existing.createdAt,
      },
      existing.id,
    );

    this.items[index] = updatedExam;
    return updatedExam;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(id));
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }

  clear(): void {
    this.items = [];
  }
}
