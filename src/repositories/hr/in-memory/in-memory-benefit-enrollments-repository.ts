import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BenefitEnrollment } from '@/entities/hr/benefit-enrollment';
import type {
  BenefitEnrollmentsRepository,
  CreateBenefitEnrollmentSchema,
  FindBenefitEnrollmentFilters,
  UpdateBenefitEnrollmentSchema,
} from '../benefit-enrollments-repository';

export class InMemoryBenefitEnrollmentsRepository
  implements BenefitEnrollmentsRepository
{
  public items: BenefitEnrollment[] = [];

  async create(
    data: CreateBenefitEnrollmentSchema,
  ): Promise<BenefitEnrollment> {
    const enrollment = BenefitEnrollment.create({
      tenantId: new UniqueEntityID(data.tenantId),
      employeeId: data.employeeId,
      benefitPlanId: data.benefitPlanId,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status ?? 'ACTIVE',
      employeeContribution: data.employeeContribution ?? 0,
      employerContribution: data.employerContribution ?? 0,
      dependantIds: data.dependantIds,
      metadata: data.metadata,
    });

    this.items.push(enrollment);
    return enrollment;
  }

  async bulkCreate(
    enrollments: CreateBenefitEnrollmentSchema[],
  ): Promise<BenefitEnrollment[]> {
    const createdEnrollments: BenefitEnrollment[] = [];

    for (const enrollmentData of enrollments) {
      const enrollment = await this.create(enrollmentData);
      createdEnrollments.push(enrollment);
    }

    return createdEnrollments;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<BenefitEnrollment | null> {
    return (
      this.items.find(
        (enrollment) =>
          enrollment.id.equals(id) &&
          enrollment.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindBenefitEnrollmentFilters,
  ): Promise<{ enrollments: BenefitEnrollment[]; total: number }> {
    let filtered = this.items.filter(
      (enrollment) => enrollment.tenantId.toString() === tenantId,
    );

    if (filters?.employeeId) {
      filtered = filtered.filter((enrollment) =>
        enrollment.employeeId.equals(filters.employeeId!),
      );
    }
    if (filters?.benefitPlanId) {
      filtered = filtered.filter((enrollment) =>
        enrollment.benefitPlanId.equals(filters.benefitPlanId!),
      );
    }
    if (filters?.status) {
      filtered = filtered.filter(
        (enrollment) => enrollment.status === filters.status,
      );
    }

    const total = filtered.length;
    const sorted = filtered.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 20, 100);

    return {
      enrollments: sorted.slice((page - 1) * perPage, page * perPage),
      total,
    };
  }

  async findByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<BenefitEnrollment[]> {
    return this.items
      .filter(
        (enrollment) =>
          enrollment.employeeId.equals(employeeId) &&
          enrollment.tenantId.toString() === tenantId,
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findActiveByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<BenefitEnrollment[]> {
    return this.items
      .filter(
        (enrollment) =>
          enrollment.employeeId.equals(employeeId) &&
          enrollment.tenantId.toString() === tenantId &&
          enrollment.status === 'ACTIVE',
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async update(
    data: UpdateBenefitEnrollmentSchema,
  ): Promise<BenefitEnrollment | null> {
    const index = this.items.findIndex((enrollment) =>
      enrollment.id.equals(data.id),
    );
    if (index === -1) return null;

    const enrollment = this.items[index];

    if (data.status === 'CANCELLED') enrollment.cancel();
    if (data.status === 'SUSPENDED') enrollment.suspend();
    if (data.status === 'ACTIVE' && enrollment.status !== 'ACTIVE')
      enrollment.reactivate();

    if (
      data.employeeContribution !== undefined ||
      data.employerContribution !== undefined
    ) {
      enrollment.updateContributions(
        data.employeeContribution ?? enrollment.employeeContribution,
        data.employerContribution ?? enrollment.employerContribution,
      );
    }

    if (data.startDate !== undefined) {
      enrollment.props.startDate = data.startDate;
      enrollment.props.updatedAt = new Date();
    }
    if (data.endDate !== undefined) {
      enrollment.props.endDate = data.endDate;
      enrollment.props.updatedAt = new Date();
    }
    if (data.dependantIds !== undefined) {
      enrollment.props.dependantIds = data.dependantIds;
      enrollment.props.updatedAt = new Date();
    }
    if (data.metadata !== undefined) {
      enrollment.props.metadata = data.metadata;
      enrollment.props.updatedAt = new Date();
    }

    return enrollment;
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    const index = this.items.findIndex((enrollment) =>
      enrollment.id.equals(id),
    );
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }
}
