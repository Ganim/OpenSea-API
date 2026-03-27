import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BenefitEnrollment } from '@/entities/hr/benefit-enrollment';
import type { BenefitEnrollmentsRepository } from '@/repositories/hr/benefit-enrollments-repository';

export interface UpdateEnrollmentRequest {
  tenantId: string;
  enrollmentId: string;
  startDate?: Date;
  endDate?: Date;
  employeeContribution?: number;
  employerContribution?: number;
  dependantIds?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateEnrollmentResponse {
  enrollment: BenefitEnrollment;
}

export class UpdateEnrollmentUseCase {
  constructor(
    private benefitEnrollmentsRepository: BenefitEnrollmentsRepository,
  ) {}

  async execute(
    request: UpdateEnrollmentRequest,
  ): Promise<UpdateEnrollmentResponse> {
    const {
      tenantId,
      enrollmentId,
      startDate,
      endDate,
      employeeContribution,
      employerContribution,
      dependantIds,
      metadata,
    } = request;

    const existingEnrollment = await this.benefitEnrollmentsRepository.findById(
      new UniqueEntityID(enrollmentId),
      tenantId,
    );

    if (!existingEnrollment) {
      throw new ResourceNotFoundError('Inscrição de benefício não encontrada');
    }

    if (existingEnrollment.status === 'CANCELLED') {
      throw new BadRequestError(
        'Não é possível atualizar uma inscrição cancelada',
      );
    }

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

    const updatedEnrollment = await this.benefitEnrollmentsRepository.update({
      id: new UniqueEntityID(enrollmentId),
      startDate,
      endDate,
      employeeContribution,
      employerContribution,
      dependantIds,
      metadata,
    });

    if (!updatedEnrollment) {
      throw new ResourceNotFoundError('Inscrição de benefício não encontrada');
    }

    return { enrollment: updatedEnrollment };
  }
}
