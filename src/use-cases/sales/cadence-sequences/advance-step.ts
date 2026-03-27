import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CadenceEnrollmentDTO } from '@/mappers/sales/cadence/cadence-sequence-to-dto';
import { cadenceEnrollmentToDTO } from '@/mappers/sales/cadence/cadence-sequence-to-dto';
import type { CadenceSequencesRepository } from '@/repositories/sales/cadence-sequences-repository';

interface AdvanceStepUseCaseRequest {
  enrollmentId: string;
  tenantId: string;
}

interface AdvanceStepUseCaseResponse {
  enrollment: CadenceEnrollmentDTO;
}

export class AdvanceStepUseCase {
  constructor(private cadenceSequencesRepository: CadenceSequencesRepository) {}

  async execute(
    input: AdvanceStepUseCaseRequest,
  ): Promise<AdvanceStepUseCaseResponse> {
    const enrollment = await this.cadenceSequencesRepository.findEnrollmentById(
      input.enrollmentId,
      input.tenantId,
    );

    if (!enrollment) {
      throw new ResourceNotFoundError('Cadence enrollment');
    }

    if (enrollment.status !== 'ACTIVE') {
      throw new BadRequestError(
        'Cannot advance step on a non-active enrollment.',
      );
    }

    const cadenceSequence = await this.cadenceSequencesRepository.findById(
      enrollment.sequenceId,
      input.tenantId,
    );

    if (!cadenceSequence) {
      throw new ResourceNotFoundError('Cadence sequence');
    }

    // Sort steps by order
    const sortedSteps = [...cadenceSequence.steps].sort(
      (stepA, stepB) => stepA.order - stepB.order,
    );

    const currentStepIndex = sortedSteps.findIndex(
      (step) => step.order === enrollment.currentStepOrder,
    );

    const isLastStep = currentStepIndex >= sortedSteps.length - 1;

    if (isLastStep) {
      // Complete the enrollment
      enrollment.status = 'COMPLETED';
      enrollment.completedAt = new Date();
      enrollment.nextActionAt = undefined;
    } else {
      // Move to next step
      const nextStep = sortedSteps[currentStepIndex + 1];
      enrollment.currentStepOrder = nextStep.order;

      const nextActionAt = new Date();
      nextActionAt.setDate(nextActionAt.getDate() + nextStep.delayDays);
      enrollment.nextActionAt = nextActionAt;
    }

    await this.cadenceSequencesRepository.saveEnrollment(enrollment);

    return {
      enrollment: cadenceEnrollmentToDTO(enrollment),
    };
  }
}
