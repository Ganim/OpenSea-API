import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CadenceEnrollmentDTO } from '@/mappers/sales/cadence/cadence-sequence-to-dto';
import { cadenceEnrollmentToDTO } from '@/mappers/sales/cadence/cadence-sequence-to-dto';
import type { CadenceSequencesRepository } from '@/repositories/sales/cadence-sequences-repository';

interface EnrollContactUseCaseRequest {
  sequenceId: string;
  tenantId: string;
  contactId?: string;
  dealId?: string;
}

interface EnrollContactUseCaseResponse {
  enrollment: CadenceEnrollmentDTO;
}

export class EnrollContactUseCase {
  constructor(private cadenceSequencesRepository: CadenceSequencesRepository) {}

  async execute(
    input: EnrollContactUseCaseRequest,
  ): Promise<EnrollContactUseCaseResponse> {
    if (!input.contactId && !input.dealId) {
      throw new BadRequestError('Either contactId or dealId must be provided.');
    }

    const cadenceSequence = await this.cadenceSequencesRepository.findById(
      new UniqueEntityID(input.sequenceId),
      input.tenantId,
    );

    if (!cadenceSequence) {
      throw new ResourceNotFoundError('Cadence sequence');
    }

    if (!cadenceSequence.isActive) {
      throw new BadRequestError(
        'Cannot enroll in an inactive cadence sequence.',
      );
    }

    if (cadenceSequence.steps.length === 0) {
      throw new BadRequestError(
        'Cannot enroll in a cadence sequence with no steps.',
      );
    }

    // Sort steps by order to find the first step
    const sortedSteps = [...cadenceSequence.steps].sort(
      (stepA, stepB) => stepA.order - stepB.order,
    );
    const firstStep = sortedSteps[0];

    // Calculate nextActionAt based on first step's delayDays
    const nextActionAt = new Date();
    nextActionAt.setDate(nextActionAt.getDate() + firstStep.delayDays);

    const enrollment = await this.cadenceSequencesRepository.createEnrollment({
      sequenceId: input.sequenceId,
      tenantId: input.tenantId,
      contactId: input.contactId,
      dealId: input.dealId,
      currentStepOrder: firstStep.order,
      status: 'ACTIVE',
      nextActionAt,
    });

    return {
      enrollment: cadenceEnrollmentToDTO(enrollment),
    };
  }
}
