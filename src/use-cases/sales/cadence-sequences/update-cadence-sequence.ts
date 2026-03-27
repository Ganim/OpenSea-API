import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CadenceStepProps } from '@/entities/sales/cadence-sequence';
import type { CadenceSequenceDTO } from '@/mappers/sales/cadence/cadence-sequence-to-dto';
import { cadenceSequenceToDTO } from '@/mappers/sales/cadence/cadence-sequence-to-dto';
import type { CadenceSequencesRepository } from '@/repositories/sales/cadence-sequences-repository';

interface UpdateCadenceStepInput {
  order: number;
  type: string;
  delayDays: number;
  config?: Record<string, unknown>;
}

interface UpdateCadenceSequenceUseCaseRequest {
  id: string;
  tenantId: string;
  name?: string;
  description?: string | null;
  steps?: UpdateCadenceStepInput[];
}

interface UpdateCadenceSequenceUseCaseResponse {
  cadenceSequence: CadenceSequenceDTO;
}

export class UpdateCadenceSequenceUseCase {
  constructor(private cadenceSequencesRepository: CadenceSequencesRepository) {}

  async execute(
    input: UpdateCadenceSequenceUseCaseRequest,
  ): Promise<UpdateCadenceSequenceUseCaseResponse> {
    const cadenceSequence = await this.cadenceSequencesRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!cadenceSequence) {
      throw new ResourceNotFoundError('Cadence sequence');
    }

    if (input.name !== undefined) {
      if (!input.name || input.name.trim().length === 0) {
        throw new BadRequestError('Cadence sequence name is required.');
      }

      if (input.name.length > 255) {
        throw new BadRequestError(
          'Cadence sequence name cannot exceed 255 characters.',
        );
      }

      cadenceSequence.name = input.name.trim();
    }

    if (input.description !== undefined) {
      cadenceSequence.description = input.description ?? undefined;
    }

    if (input.steps !== undefined) {
      if (input.steps.length === 0) {
        throw new BadRequestError(
          'Cadence sequence must have at least one step.',
        );
      }

      const validStepTypes = [
        'EMAIL',
        'CALL',
        'TASK',
        'LINKEDIN',
        'WHATSAPP',
        'WAIT',
      ];

      for (const stepInput of input.steps) {
        if (!validStepTypes.includes(stepInput.type)) {
          throw new BadRequestError(
            `Invalid step type: ${stepInput.type}. Valid types: ${validStepTypes.join(', ')}`,
          );
        }

        if (stepInput.delayDays < 0) {
          throw new BadRequestError('Step delay days cannot be negative.');
        }
      }

      const updatedSteps: CadenceStepProps[] = input.steps.map((stepInput) => ({
        id: new UniqueEntityID(),
        sequenceId: cadenceSequence.id,
        order: stepInput.order,
        type: stepInput.type as CadenceStepProps['type'],
        delayDays: stepInput.delayDays,
        config: stepInput.config ?? {},
        createdAt: new Date(),
      }));

      cadenceSequence.steps = updatedSteps;
    }

    await this.cadenceSequencesRepository.save(cadenceSequence);

    return {
      cadenceSequence: cadenceSequenceToDTO(cadenceSequence),
    };
  }
}
