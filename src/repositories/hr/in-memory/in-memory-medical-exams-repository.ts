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
        examCategory: data.examCategory as MedicalExam['type'],
        validityMonths: data.validityMonths,
        clinicName: data.clinicName,
        clinicAddress: data.clinicAddress,
        physicianName: data.physicianName,
        physicianCRM: data.physicianCRM,
        aptitude: data.aptitude as MedicalExam['aptitude'],
        restrictions: data.restrictions,
        nextExamDate: data.nextExamDate,
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

    if (filters?.aptitude) {
      filteredItems = filteredItems.filter(
        (item) => item.aptitude === filters.aptitude,
      );
    }

    if (filters?.status) {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now);
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      filteredItems = filteredItems.filter((item) => {
        if (!item.expirationDate) return filters.status === 'VALID';
        if (filters.status === 'EXPIRED') return item.expirationDate < now;
        if (filters.status === 'EXPIRING')
          return (
            item.expirationDate >= now &&
            item.expirationDate <= thirtyDaysFromNow
          );
        if (filters.status === 'VALID')
          return item.expirationDate > thirtyDaysFromNow;
        return true;
      });
    }

    const page = filters?.page ?? 1;
    const perPage = filters?.perPage ?? 20;
    const start = (page - 1) * perPage;

    return filteredItems.slice(start, start + perPage);
  }

  async findExpiring(
    tenantId: string,
    daysThreshold: number,
  ): Promise<MedicalExam[]> {
    const now = new Date();
    const threshold = new Date(now);
    threshold.setDate(threshold.getDate() + daysThreshold);

    return this.items.filter((item) => {
      if (item.tenantId.toString() !== tenantId) return false;
      if (!item.expirationDate) return false;
      return item.expirationDate > now && item.expirationDate <= threshold;
    });
  }

  async findOverdue(tenantId: string): Promise<MedicalExam[]> {
    const now = new Date();
    return this.items.filter((item) => {
      if (item.tenantId.toString() !== tenantId) return false;
      if (!item.expirationDate) return false;
      return item.expirationDate < now;
    });
  }

  async update(data: UpdateMedicalExamSchema): Promise<MedicalExam | null> {
    const index = this.items.findIndex(
      (item) =>
        item.id.equals(data.id) &&
        (!data.tenantId || item.tenantId.toString() === data.tenantId),
    );

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
        examCategory:
          (data.examCategory as MedicalExam['type']) ?? existing.examCategory,
        validityMonths: data.validityMonths ?? existing.validityMonths,
        clinicName: data.clinicName ?? existing.clinicName,
        clinicAddress: data.clinicAddress ?? existing.clinicAddress,
        physicianName: data.physicianName ?? existing.physicianName,
        physicianCRM: data.physicianCRM ?? existing.physicianCRM,
        aptitude:
          (data.aptitude as MedicalExam['aptitude']) ?? existing.aptitude,
        restrictions: data.restrictions ?? existing.restrictions,
        nextExamDate: data.nextExamDate ?? existing.nextExamDate,
        createdAt: existing.createdAt,
      },
      existing.id,
    );

    this.items[index] = updatedExam;
    return updatedExam;
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    const index = this.items.findIndex(
      (item) =>
        item.id.equals(id) &&
        (!tenantId || item.tenantId.toString() === tenantId),
    );
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }

  clear(): void {
    this.items = [];
  }
}
