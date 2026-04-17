import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BenefitEnrollment } from '@/entities/hr/benefit-enrollment';
import { prisma } from '@/lib/prisma';
import { mapBenefitEnrollmentPrismaToDomain } from '@/mappers/hr/benefit-enrollment';
import type {
  BenefitEnrollmentsRepository,
  CreateBenefitEnrollmentSchema,
  FindBenefitEnrollmentFilters,
  UpdateBenefitEnrollmentSchema,
} from '../benefit-enrollments-repository';

export class PrismaBenefitEnrollmentsRepository
  implements BenefitEnrollmentsRepository
{
  async create(
    data: CreateBenefitEnrollmentSchema,
  ): Promise<BenefitEnrollment> {
    const enrollmentData = await prisma.benefitEnrollment.create({
      data: {
        tenantId: data.tenantId,
        employeeId: data.employeeId.toString(),
        benefitPlanId: data.benefitPlanId.toString(),
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status ?? 'ACTIVE',
        employeeContribution: data.employeeContribution ?? 0,
        employerContribution: data.employerContribution ?? 0,
        dependantIds: data.dependantIds ?? undefined,
        metadata: data.metadata ?? undefined,
      },
    });

    return BenefitEnrollment.create(
      mapBenefitEnrollmentPrismaToDomain(enrollmentData),
      new UniqueEntityID(enrollmentData.id),
    );
  }

  async bulkCreate(
    enrollments: CreateBenefitEnrollmentSchema[],
  ): Promise<BenefitEnrollment[]> {
    const createdEnrollments: BenefitEnrollment[] = [];

    await prisma.$transaction(async (tx) => {
      for (const enrollmentData of enrollments) {
        const created = await tx.benefitEnrollment.create({
          data: {
            tenantId: enrollmentData.tenantId,
            employeeId: enrollmentData.employeeId.toString(),
            benefitPlanId: enrollmentData.benefitPlanId.toString(),
            startDate: enrollmentData.startDate,
            endDate: enrollmentData.endDate,
            status: enrollmentData.status ?? 'ACTIVE',
            employeeContribution: enrollmentData.employeeContribution ?? 0,
            employerContribution: enrollmentData.employerContribution ?? 0,
            dependantIds: enrollmentData.dependantIds ?? undefined,
            metadata: enrollmentData.metadata ?? undefined,
          },
        });

        createdEnrollments.push(
          BenefitEnrollment.create(
            mapBenefitEnrollmentPrismaToDomain(created),
            new UniqueEntityID(created.id),
          ),
        );
      }
    });

    return createdEnrollments;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<BenefitEnrollment | null> {
    const enrollmentData = await prisma.benefitEnrollment.findFirst({
      where: { id: id.toString(), tenantId },
    });

    if (!enrollmentData) return null;

    return BenefitEnrollment.create(
      mapBenefitEnrollmentPrismaToDomain(enrollmentData),
      new UniqueEntityID(enrollmentData.id),
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindBenefitEnrollmentFilters,
  ): Promise<{ enrollments: BenefitEnrollment[]; total: number }> {
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 20, 100);
    const skip = (page - 1) * perPage;

    const where = {
      tenantId,
      employeeId: filters?.employeeId?.toString(),
      benefitPlanId: filters?.benefitPlanId?.toString(),
      status: filters?.status,
    };

    const [enrollmentsData, total] = await Promise.all([
      prisma.benefitEnrollment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.benefitEnrollment.count({ where }),
    ]);

    const enrollments = enrollmentsData.map((enrollment) =>
      BenefitEnrollment.create(
        mapBenefitEnrollmentPrismaToDomain(enrollment),
        new UniqueEntityID(enrollment.id),
      ),
    );

    return { enrollments, total };
  }

  async findByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<BenefitEnrollment[]> {
    const enrollmentsData = await prisma.benefitEnrollment.findMany({
      where: {
        tenantId,
        employeeId: employeeId.toString(),
      },
      orderBy: { createdAt: 'desc' },
    });

    return enrollmentsData.map((enrollment) =>
      BenefitEnrollment.create(
        mapBenefitEnrollmentPrismaToDomain(enrollment),
        new UniqueEntityID(enrollment.id),
      ),
    );
  }

  async findActiveByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<BenefitEnrollment[]> {
    const enrollmentsData = await prisma.benefitEnrollment.findMany({
      where: {
        tenantId,
        employeeId: employeeId.toString(),
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
    });

    return enrollmentsData.map((enrollment) =>
      BenefitEnrollment.create(
        mapBenefitEnrollmentPrismaToDomain(enrollment),
        new UniqueEntityID(enrollment.id),
      ),
    );
  }

  async update(
    data: UpdateBenefitEnrollmentSchema,
  ): Promise<BenefitEnrollment | null> {
    const existingEnrollment = await prisma.benefitEnrollment.findUnique({
      where: {
        id: data.id.toString(),
        ...(data.tenantId && { tenantId: data.tenantId }),
      },
    });

    if (!existingEnrollment) return null;

    const enrollmentData = await prisma.benefitEnrollment.update({
      where: {
        id: data.id.toString(),
        ...(data.tenantId && { tenantId: data.tenantId }),
      },
      data: {
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status,
        employeeContribution: data.employeeContribution,
        employerContribution: data.employerContribution,
        dependantIds: data.dependantIds ?? undefined,
        metadata: data.metadata ?? undefined,
      },
    });

    return BenefitEnrollment.create(
      mapBenefitEnrollmentPrismaToDomain(enrollmentData),
      new UniqueEntityID(enrollmentData.id),
    );
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    await prisma.benefitEnrollment.delete({
      where: { id: id.toString(), ...(tenantId && { tenantId }) },
    });
  }
}
