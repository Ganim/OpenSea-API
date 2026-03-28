import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TrainingEnrollment } from '@/entities/hr/training-enrollment';
import type { TrainingEnrollmentsRepository } from '@/repositories/hr/training-enrollments-repository';

export interface CancelEnrollmentRequest {
  tenantId: string;
  enrollmentId: string;
}

export interface CancelEnrollmentResponse {
  enrollment: TrainingEnrollment;
}

export class CancelEnrollmentUseCase {
  constructor(
    private trainingEnrollmentsRepository: TrainingEnrollmentsRepository,
  ) {}

  async execute(
    request: CancelEnrollmentRequest,
  ): Promise<CancelEnrollmentResponse> {
    const { tenantId, enrollmentId } = request;

    const enrollment = await this.trainingEnrollmentsRepository.findById(
      new UniqueEntityID(enrollmentId),
      tenantId,
    );

    if (!enrollment) {
      throw new ResourceNotFoundError('Inscrição não encontrada');
    }

    if (enrollment.status === 'COMPLETED') {
      throw new BadRequestError(
        'Não é possível cancelar uma inscrição já concluída',
      );
    }

    if (enrollment.status === 'CANCELLED') {
      throw new BadRequestError('Esta inscrição já está cancelada');
    }

    const updatedEnrollment = await this.trainingEnrollmentsRepository.update({
      id: new UniqueEntityID(enrollmentId),
      status: 'CANCELLED',
    });

    if (!updatedEnrollment) {
      throw new ResourceNotFoundError('Inscrição não encontrada');
    }

    return { enrollment: updatedEnrollment };
  }
}
