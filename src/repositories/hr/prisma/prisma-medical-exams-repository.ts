import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { MedicalExam } from '@/entities/hr/medical-exam';
import { prisma } from '@/lib/prisma';
import { mapMedicalExamPrismaToDomain } from '@/mappers/hr/medical-exam';
import type {
  MedicalExamsRepository,
  CreateMedicalExamSchema,
  FindMedicalExamFilters,
  UpdateMedicalExamSchema,
} from '../medical-exams-repository';

export class PrismaMedicalExamsRepository implements MedicalExamsRepository {
  async create(data: CreateMedicalExamSchema): Promise<MedicalExam> {
    const record = await prisma.medicalExam.create({
      data: {
        tenantId: data.tenantId,
        employeeId: data.employeeId.toString(),
        type: data.type,
        examDate: data.examDate,
        expirationDate: data.expirationDate,
        doctorName: data.doctorName,
        doctorCrm: data.doctorCrm,
        result: data.result,
        observations: data.observations,
        documentUrl: data.documentUrl,
        examCategory: data.examCategory,
        validityMonths: data.validityMonths,
        clinicName: data.clinicName,
        clinicAddress: data.clinicAddress,
        physicianName: data.physicianName,
        physicianCRM: data.physicianCRM,
        aptitude: data.aptitude,
        restrictions: data.restrictions,
        nextExamDate: data.nextExamDate,
      },
    });

    return MedicalExam.create(
      mapMedicalExamPrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<MedicalExam | null> {
    const record = await prisma.medicalExam.findFirst({
      where: { id: id.toString(), tenantId },
    });

    if (!record) return null;

    return MedicalExam.create(
      mapMedicalExamPrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }

  async findByEmployeeId(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<MedicalExam[]> {
    const records = await prisma.medicalExam.findMany({
      where: {
        tenantId,
        employeeId: employeeId.toString(),
      },
      orderBy: { examDate: 'desc' },
    });

    return records.map((record) =>
      MedicalExam.create(
        mapMedicalExamPrismaToDomain(record),
        new UniqueEntityID(record.id),
      ),
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindMedicalExamFilters,
  ): Promise<MedicalExam[]> {
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 50, 100);
    const skip = (page - 1) * perPage;

    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: Record<string, any> = {
      tenantId,
      employeeId: filters?.employeeId?.toString(),
      type: filters?.type,
      result: filters?.result,
      aptitude: filters?.aptitude,
    };

    if (filters?.status === 'EXPIRED') {
      whereClause.expirationDate = { lt: now };
    } else if (filters?.status === 'EXPIRING') {
      whereClause.expirationDate = { gte: now, lte: thirtyDaysFromNow };
    } else if (filters?.status === 'VALID') {
      whereClause.OR = [
        { expirationDate: null },
        { expirationDate: { gt: thirtyDaysFromNow } },
      ];
    }

    const records = await prisma.medicalExam.findMany({
      where: whereClause,
      orderBy: { examDate: 'desc' },
      skip,
      take: perPage,
    });

    return records.map((record) =>
      MedicalExam.create(
        mapMedicalExamPrismaToDomain(record),
        new UniqueEntityID(record.id),
      ),
    );
  }

  async findExpiring(
    tenantId: string,
    daysThreshold: number,
  ): Promise<MedicalExam[]> {
    const now = new Date();
    const threshold = new Date(now);
    threshold.setDate(threshold.getDate() + daysThreshold);

    const records = await prisma.medicalExam.findMany({
      where: {
        tenantId,
        expirationDate: { gt: now, lte: threshold },
      },
      orderBy: { expirationDate: 'asc' },
    });

    return records.map((record) =>
      MedicalExam.create(
        mapMedicalExamPrismaToDomain(record),
        new UniqueEntityID(record.id),
      ),
    );
  }

  async findOverdue(tenantId: string): Promise<MedicalExam[]> {
    const now = new Date();

    const records = await prisma.medicalExam.findMany({
      where: {
        tenantId,
        expirationDate: { lt: now },
      },
      orderBy: { expirationDate: 'asc' },
    });

    return records.map((record) =>
      MedicalExam.create(
        mapMedicalExamPrismaToDomain(record),
        new UniqueEntityID(record.id),
      ),
    );
  }

  async update(data: UpdateMedicalExamSchema): Promise<MedicalExam | null> {
    const existing = await prisma.medicalExam.findUnique({
      where: {
        id: data.id.toString(),
        ...(data.tenantId && { tenantId: data.tenantId }),
      },
    });

    if (!existing) return null;

    const record = await prisma.medicalExam.update({
      where: {
        id: data.id.toString(),
        ...(data.tenantId && { tenantId: data.tenantId }),
      },
      data: {
        type: data.type,
        examDate: data.examDate,
        expirationDate: data.expirationDate,
        doctorName: data.doctorName,
        doctorCrm: data.doctorCrm,
        result: data.result,
        observations: data.observations,
        documentUrl: data.documentUrl,
        examCategory: data.examCategory,
        validityMonths: data.validityMonths,
        clinicName: data.clinicName,
        clinicAddress: data.clinicAddress,
        physicianName: data.physicianName,
        physicianCRM: data.physicianCRM,
        aptitude: data.aptitude,
        restrictions: data.restrictions,
        nextExamDate: data.nextExamDate,
      },
    });

    return MedicalExam.create(
      mapMedicalExamPrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    await prisma.medicalExam.delete({
      where: { id: id.toString(), ...(tenantId && { tenantId }) },
    });
  }
}
