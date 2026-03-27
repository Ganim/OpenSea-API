import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { CadenceSequenceDTO } from '@/mappers/sales/cadence/cadence-sequence-to-dto';
import { cadenceSequenceToDTO } from '@/mappers/sales/cadence/cadence-sequence-to-dto';
import type { CadenceSequencesRepository } from '@/repositories/sales/cadence-sequences-repository';

interface CreateCadenceStepInput {
  order: number;
  type: string;
  delayDays: number;
  config?: Record<string, unknown>;
}

interface CreateCadenceSequenceUseCaseRequest {
  tenantId: string;
  name: string;
  description?: string;
  createdBy: string;
  steps: CreateCadenceStepInput[];
}

interface CreateCadenceSequenceUseCaseResponse {
  cadenceSequence: CadenceSequenceDTO;
}

export class CreateCadenceSequenceUseCase {
  constructor(private cadenceSequencesRepository: CadenceSequencesRepository) {}

  async execute(
    input: CreateCadenceSequenceUseCaseRequest,
  ): Promise<CreateCadenceSequenceUseCaseResponse> {
    if (!input.name || input.name.trim().length === 0) {
      throw new BadRequestError('Cadence sequence name is required.');
    }

    if (input.name.length > 255) {
      throw new BadRequestError(
        'Cadence sequence name cannot exceed 255 characters.',
      );
    }

    if (!input.steps || input.steps.length === 0) {
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

    const cadenceSequence = await this.cadenceSequencesRepository.create({
      tenantId: input.tenantId,
      name: input.name.trim(),
      description: input.description,
      createdBy: input.createdBy,
      steps: input.steps.map((stepInput) => ({
        order: stepInput.order,
        type: stepInput.type,
        delayDays: stepInput.delayDays,
        config: stepInput.config ?? {},
      })),
    });

    return {
      cadenceSequence: cadenceSequenceToDTO(cadenceSequence),
    };
  }
}
