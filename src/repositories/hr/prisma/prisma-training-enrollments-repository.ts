import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TrainingEnrollment } from '@/entities/hr/training-enrollment';
import { prisma } from '@/lib/prisma';
import { mapTrainingEnrollmentPrismaToDomain } from '@/mappers/hr/training-enrollment';
import type {
  CreateTrainingEnrollmentSchema,
  FindTrainingEnrollmentFilters,
  TrainingEnrollmentsRepository,
  UpdateTrainingEnrollmentSchema,
} from '../training-enrollments-repository';

export class PrismaTrainingEnrollmentsRepository
  implements TrainingEnrollmentsRepository
{
  async create(
    data: CreateTrainingEnrollmentSchema,
  ): Promise<TrainingEnrollment> {
    const enrollmentData = await prisma.trainingEnrollment.create({
      data: {
        tenantId: data.tenantId,
        trainingProgramId: data.trainingProgramId.toString(),
        employeeId: data.employeeId.toString(),
        status: data.status ?? 'ENROLLED',
        notes: data.notes,
      },
    });

    return TrainingEnrollment.create(
      mapTrainingEnrollmentPrismaToDomain(enrollmentData),
      new UniqueEntityID(enrollmentData.id),
    );
  }

  async bulkCreate(
    enrollments: CreateTrainingEnrollmentSchema[],
  ): Promise<TrainingEnrollment[]> {
    const created: TrainingEnrollment[] = [];
    for (const data of enrollments) {
      const enrollment = await this.create(data);
      created.push(enrollment);
    }
    return created;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<TrainingEnrollment | null> {
    const enrollmentData = await prisma.trainingEnrollment.findFirst({
      where: { id: id.toString(), tenantId },
    });

    if (!enrollmentData) return null;

    return TrainingEnrollment.create(
      mapTrainingEnrollmentPrismaToDomain(enrollmentData),
      new UniqueEntityID(enrollmentData.id),
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindTrainingEnrollmentFilters,
  ): Promise<{ enrollments: TrainingEnrollment[]; total: number }> {
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 20, 100);
    const skip = (page - 1) * perPage;

    const where = {
      tenantId,
      trainingProgramId: filters?.trainingProgramId?.toString(),
      employeeId: filters?.employeeId?.toString(),
      status: filters?.status,
    };

    const [enrollmentsData, total] = await Promise.all([
      prisma.trainingEnrollment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.trainingEnrollment.count({ where }),
    ]);

    const enrollments = enrollmentsData.map((enrollment) =>
      TrainingEnrollment.create(
        mapTrainingEnrollmentPrismaToDomain(enrollment),
        new UniqueEntityID(enrollment.id),
      ),
    );

    return { enrollments, total };
  }

  async findByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<TrainingEnrollment[]> {
    const enrollmentsData = await prisma.trainingEnrollment.findMany({
      where: { employeeId: employeeId.toString(), tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return enrollmentsData.map((enrollment) =>
      TrainingEnrollment.create(
        mapTrainingEnrollmentPrismaToDomain(enrollment),
        new UniqueEntityID(enrollment.id),
      ),
    );
  }

  async findByProgramAndEmployee(
    trainingProgramId: UniqueEntityID,
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<TrainingEnrollment | null> {
    const enrollmentData = await prisma.trainingEnrollment.findFirst({
      where: {
        trainingProgramId: trainingProgramId.toString(),
        employeeId: employeeId.toString(),
        tenantId,
      },
    });

    if (!enrollmentData) return null;

    return TrainingEnrollment.create(
      mapTrainingEnrollmentPrismaToDomain(enrollmentData),
      new UniqueEntityID(enrollmentData.id),
    );
  }

  async findExpiringWithin(daysAhead: number): Promise<TrainingEnrollment[]> {
    const now = new Date();
    const threshold = new Date(now);
    threshold.setDate(threshold.getDate() + daysAhead);

    const records = await prisma.trainingEnrollment.findMany({
      where: {
        status: 'COMPLETED',
        expirationDate: { gte: now, lt: threshold },
      },
      orderBy: { expirationDate: 'asc' },
    });

    return records.map((record) =>
      TrainingEnrollment.create(
        mapTrainingEnrollmentPrismaToDomain(record),
        new UniqueEntityID(record.id),
      ),
    );
  }

  async findExpiredSince(since: Date): Promise<TrainingEnrollment[]> {
    const now = new Date();
    const records = await prisma.trainingEnrollment.findMany({
      where: {
        status: 'COMPLETED',
        expirationDate: { gte: since, lt: now },
      },
      orderBy: { expirationDate: 'asc' },
    });

    return records.map((record) =>
      TrainingEnrollment.create(
        mapTrainingEnrollmentPrismaToDomain(record),
        new UniqueEntityID(record.id),
      ),
    );
  }

  async update(
    data: UpdateTrainingEnrollmentSchema,
  ): Promise<TrainingEnrollment | null> {
    const existing = await prisma.trainingEnrollment.findUnique({
      where: {
        id: data.id.toString(),
        ...(data.tenantId && { tenantId: data.tenantId }),
      },
    });

    if (!existing) return null;

    const enrollmentData = await prisma.trainingEnrollment.update({
      where: {
        id: data.id.toString(),
        ...(data.tenantId && { tenantId: data.tenantId }),
      },
      data: {
        status: data.status,
        startedAt: data.startedAt,
        completedAt: data.completedAt,
        expirationDate: data.expirationDate,
        score: data.score,
        certificateUrl: data.certificateUrl,
        notes: data.notes,
      },
    });

    return TrainingEnrollment.create(
      mapTrainingEnrollmentPrismaToDomain(enrollmentData),
      new UniqueEntityID(enrollmentData.id),
    );
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    await prisma.trainingEnrollment.delete({
      where: { id: id.toString(), ...(tenantId && { tenantId }) },
    });
  }
}
