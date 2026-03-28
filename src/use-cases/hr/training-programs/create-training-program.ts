import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { TrainingProgram } from '@/entities/hr/training-program';
import type { TrainingProgramsRepository } from '@/repositories/hr/training-programs-repository';

const VALID_CATEGORIES = [
  'ONBOARDING',
  'SAFETY',
  'TECHNICAL',
  'COMPLIANCE',
  'LEADERSHIP',
  'SOFT_SKILLS',
] as const;

const VALID_FORMATS = ['PRESENCIAL', 'ONLINE', 'HIBRIDO'] as const;

export interface CreateTrainingProgramRequest {
  tenantId: string;
  name: string;
  description?: string;
  category: string;
  format: string;
  durationHours: number;
  instructor?: string;
  maxParticipants?: number;
  isMandatory?: boolean;
  validityMonths?: number;
}

export interface CreateTrainingProgramResponse {
  trainingProgram: TrainingProgram;
}

export class CreateTrainingProgramUseCase {
  constructor(private trainingProgramsRepository: TrainingProgramsRepository) {}

  async execute(
    request: CreateTrainingProgramRequest,
  ): Promise<CreateTrainingProgramResponse> {
    const {
      tenantId,
      name,
      description,
      category,
      format,
      durationHours,
      instructor,
      maxParticipants,
      isMandatory,
      validityMonths,
    } = request;

    if (!name || name.trim().length === 0) {
      throw new BadRequestError(
        'O nome do programa de treinamento é obrigatório',
      );
    }

    if (
      !VALID_CATEGORIES.includes(category as (typeof VALID_CATEGORIES)[number])
    ) {
      throw new BadRequestError(
        `Categoria inválida. Categorias válidas: ${VALID_CATEGORIES.join(', ')}`,
      );
    }

    if (!VALID_FORMATS.includes(format as (typeof VALID_FORMATS)[number])) {
      throw new BadRequestError(
        `Formato inválido. Formatos válidos: ${VALID_FORMATS.join(', ')}`,
      );
    }

    if (durationHours <= 0) {
      throw new BadRequestError('A duração em horas deve ser maior que zero');
    }

    const trainingProgram = await this.trainingProgramsRepository.create({
      tenantId,
      name: name.trim(),
      description: description?.trim(),
      category,
      format,
      durationHours,
      instructor: instructor?.trim(),
      maxParticipants,
      isMandatory,
      validityMonths,
    });

    return { trainingProgram };
  }
}
