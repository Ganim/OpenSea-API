import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TrainingEnrollment } from '@/entities/hr/training-enrollment';
import type { TrainingEnrollmentsRepository } from '@/repositories/hr/training-enrollments-repository';

export interface CompleteEnrollmentRequest {
  tenantId: string;
  enrollmentId: string;
  score?: number;
  certificateUrl?: string;
}

export interface CompleteEnrollmentResponse {
  enrollment: TrainingEnrollment;
}

export class CompleteEnrollmentUseCase {
  constructor(
    private trainingEnrollmentsRepository: TrainingEnrollmentsRepository,
  ) {}

  async execute(
    request: CompleteEnrollmentRequest,
  ): Promise<CompleteEnrollmentResponse> {
    const { tenantId, enrollmentId, score, certificateUrl } = request;

    const enrollment = await this.trainingEnrollmentsRepository.findById(
      new UniqueEntityID(enrollmentId),
      tenantId,
    );

    if (!enrollment) {
      throw new ResourceNotFoundError('Inscrição não encontrada');
    }

    if (enrollment.status === 'COMPLETED') {
      throw new BadRequestError('Esta inscrição já foi concluída');
    }

    if (enrollment.status === 'CANCELLED') {
      throw new BadRequestError(
        'Não é possível concluir uma inscrição cancelada',
      );
    }

    if (score !== undefined && (score < 0 || score > 100)) {
      throw new BadRequestError('A nota deve estar entre 0 e 100');
    }

    const updatedEnrollment = await this.trainingEnrollmentsRepository.update({
      id: new UniqueEntityID(enrollmentId),
      status: 'COMPLETED',
      completedAt: new Date(),
      score,
      certificateUrl,
    });

    if (!updatedEnrollment) {
      throw new ResourceNotFoundError('Inscrição não encontrada');
    }

    return { enrollment: updatedEnrollment };
  }
}
