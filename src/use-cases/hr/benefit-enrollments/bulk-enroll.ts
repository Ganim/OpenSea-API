import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BenefitEnrollment } from '@/entities/hr/benefit-enrollment';
import type {
  BenefitEnrollmentsRepository,
  CreateBenefitEnrollmentSchema,
} from '@/repositories/hr/benefit-enrollments-repository';
import type { BenefitPlansRepository } from '@/repositories/hr/benefit-plans-repository';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';

export interface BulkEnrollRequest {
  tenantId: string;
  benefitPlanId: string;
  employeeIds: string[];
  startDate: Date;
  endDate?: Date;
  employeeContribution?: number;
  employerContribution?: number;
}

export interface BulkEnrollResponse {
  enrollments: BenefitEnrollment[];
  failedEmployeeIds: string[];
}

export class BulkEnrollUseCase {
  constructor(
    private benefitEnrollmentsRepository: BenefitEnrollmentsRepository,
    private benefitPlansRepository: BenefitPlansRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(request: BulkEnrollRequest): Promise<BulkEnrollResponse> {
    const {
      tenantId,
      benefitPlanId,
      employeeIds,
      startDate,
      endDate,
      employeeContribution,
      employerContribution,
    } = request;

    if (!employeeIds || employeeIds.length === 0) {
      throw new BadRequestError(
        'É necessário informar pelo menos um funcionário',
      );
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

    const enrollmentsToCreate: CreateBenefitEnrollmentSchema[] = [];
    const failedEmployeeIds: string[] = [];

    for (const employeeId of employeeIds) {
      // Verify employee exists
      const employee = await this.employeesRepository.findById(
        new UniqueEntityID(employeeId),
        tenantId,
      );

      if (!employee) {
        failedEmployeeIds.push(employeeId);
        continue;
      }

      // Check for existing active enrollment
      const existingEnrollments =
        await this.benefitEnrollmentsRepository.findActiveByEmployee(
          new UniqueEntityID(employeeId),
          tenantId,
        );

      const alreadyEnrolled = existingEnrollments.some(
        (enrollment) => enrollment.benefitPlanId.toString() === benefitPlanId,
      );

      if (alreadyEnrolled) {
        failedEmployeeIds.push(employeeId);
        continue;
      }

      enrollmentsToCreate.push({
        tenantId,
        employeeId: new UniqueEntityID(employeeId),
        benefitPlanId: new UniqueEntityID(benefitPlanId),
        startDate,
        endDate,
        employeeContribution,
        employerContribution,
      });
    }

    const enrollments =
      enrollmentsToCreate.length > 0
        ? await this.benefitEnrollmentsRepository.bulkCreate(
            enrollmentsToCreate,
          )
        : [];

    return { enrollments, failedEmployeeIds };
  }
}
