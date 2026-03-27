import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BenefitEnrollment } from '@/entities/hr/benefit-enrollment';
import type { BenefitEnrollmentsRepository } from '@/repositories/hr/benefit-enrollments-repository';
import type { BenefitPlansRepository } from '@/repositories/hr/benefit-plans-repository';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';

export interface EnrollEmployeeRequest {
  tenantId: string;
  employeeId: string;
  benefitPlanId: string;
  startDate: Date;
  endDate?: Date;
  employeeContribution?: number;
  employerContribution?: number;
  dependantIds?: string[];
  metadata?: Record<string, unknown>;
}

export interface EnrollEmployeeResponse {
  enrollment: BenefitEnrollment;
}

export class EnrollEmployeeUseCase {
  constructor(
    private benefitEnrollmentsRepository: BenefitEnrollmentsRepository,
    private benefitPlansRepository: BenefitPlansRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(
    request: EnrollEmployeeRequest,
  ): Promise<EnrollEmployeeResponse> {
    const {
      tenantId,
      employeeId,
      benefitPlanId,
      startDate,
      endDate,
      employeeContribution,
      employerContribution,
      dependantIds,
      metadata,
    } = request;

    // Verify employee exists
    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
      tenantId,
    );

    if (!employee) {
      throw new ResourceNotFoundError('Funcionário não encontrado');
    }

    // Verify benefit plan exists and is active
    const benefitPlan = await this.benefitPlansRepository.findById(
      new UniqueEntityID(benefitPlanId),
      tenantId,
    );

    if (!benefitPlan) {
      throw new ResourceNotFoundError('Plano de benefício não encontrado');
    }

    if (!benefitPlan.isActive) {
      throw new BadRequestError(
        'Não é possível inscrever em um plano de benefício inativo',
      );
    }

    // Check for duplicate active enrollment
    const existingEnrollments =
      await this.benefitEnrollmentsRepository.findActiveByEmployee(
        new UniqueEntityID(employeeId),
        tenantId,
      );

    const alreadyEnrolled = existingEnrollments.some(
      (enrollment) => enrollment.benefitPlanId.toString() === benefitPlanId,
    );

    if (alreadyEnrolled) {
      throw new BadRequestError(
        'Funcionário já está inscrito neste plano de benefício',
      );
    }

    // Validate contributions
    if (employeeContribution !== undefined && employeeContribution < 0) {
      throw new BadRequestError(
        'A contribuição do funcionário não pode ser negativa',
      );
    }
    if (employerContribution !== undefined && employerContribution < 0) {
      throw new BadRequestError(
        'A contribuição da empresa não pode ser negativa',
      );
    }

    const enrollment = await this.benefitEnrollmentsRepository.create({
      tenantId,
      employeeId: new UniqueEntityID(employeeId),
      benefitPlanId: new UniqueEntityID(benefitPlanId),
      startDate,
      endDate,
      employeeContribution,
      employerContribution,
      dependantIds,
      metadata,
    });

    return { enrollment };
  }
}
