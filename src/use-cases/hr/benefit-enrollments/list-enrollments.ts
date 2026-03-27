import type { BenefitEnrollment } from '@/entities/hr/benefit-enrollment';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BenefitEnrollmentsRepository } from '@/repositories/hr/benefit-enrollments-repository';

export interface ListEnrollmentsRequest {
  tenantId: string;
  employeeId?: string;
  benefitPlanId?: string;
  status?: string;
  page?: number;
  perPage?: number;
}

export interface ListEnrollmentsResponse {
  enrollments: BenefitEnrollment[];
  total: number;
}

export class ListEnrollmentsUseCase {
  constructor(
    private benefitEnrollmentsRepository: BenefitEnrollmentsRepository,
  ) {}

  async execute(
    request: ListEnrollmentsRequest,
  ): Promise<ListEnrollmentsResponse> {
    const { tenantId, employeeId, benefitPlanId, status, page, perPage } =
      request;

    const { enrollments, total } =
      await this.benefitEnrollmentsRepository.findMany(tenantId, {
        employeeId: employeeId ? new UniqueEntityID(employeeId) : undefined,
        benefitPlanId: benefitPlanId
          ? new UniqueEntityID(benefitPlanId)
          : undefined,
        status,
        page,
        perPage,
      });

    return { enrollments, total };
  }
}
