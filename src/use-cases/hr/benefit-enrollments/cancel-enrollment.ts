import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BenefitEnrollment } from '@/entities/hr/benefit-enrollment';
import type { BenefitEnrollmentsRepository } from '@/repositories/hr/benefit-enrollments-repository';

export interface CancelEnrollmentRequest {
  tenantId: string;
  enrollmentId: string;
}

export interface CancelEnrollmentResponse {
  enrollment: BenefitEnrollment;
}

export class CancelEnrollmentUseCase {
  constructor(
    private benefitEnrollmentsRepository: BenefitEnrollmentsRepository,
  ) {}

  async execute(
    request: CancelEnrollmentRequest,
  ): Promise<CancelEnrollmentResponse> {
    const { tenantId, enrollmentId } = request;

    const existingEnrollment = await this.benefitEnrollmentsRepository.findById(
      new UniqueEntityID(enrollmentId),
      tenantId,
    );

    if (!existingEnrollment) {
      throw new ResourceNotFoundError('Inscrição de benefício não encontrada');
    }

    if (existingEnrollment.status === 'CANCELLED') {
      throw new BadRequestError('Esta inscrição já está cancelada');
    }

    const cancelledEnrollment = await this.benefitEnrollmentsRepository.update({
      id: new UniqueEntityID(enrollmentId),
      status: 'CANCELLED',
      endDate: new Date(),
    });

    if (!cancelledEnrollment) {
      throw new ResourceNotFoundError('Inscrição de benefício não encontrada');
    }

    return { enrollment: cancelledEnrollment };
  }
}
