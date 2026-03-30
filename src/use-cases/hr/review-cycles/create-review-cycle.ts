import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { ReviewCycle } from '@/entities/hr/review-cycle';
import type { ReviewCyclesRepository } from '@/repositories/hr/review-cycles-repository';

const VALID_TYPES = [
  'ANNUAL',
  'SEMI_ANNUAL',
  'QUARTERLY',
  'PROBATION',
  'CUSTOM',
] as const;

export interface CreateReviewCycleRequest {
  tenantId: string;
  name: string;
  description?: string;
  type: string;
  startDate: Date;
  endDate: Date;
}

export interface CreateReviewCycleResponse {
  reviewCycle: ReviewCycle;
}

export class CreateReviewCycleUseCase {
  constructor(private reviewCyclesRepository: ReviewCyclesRepository) {}

  async execute(
    request: CreateReviewCycleRequest,
  ): Promise<CreateReviewCycleResponse> {
    const { tenantId, name, description, type, startDate, endDate } = request;

    if (!name || name.trim().length === 0) {
      throw new BadRequestError('O nome do ciclo de avaliação é obrigatório');
    }

    if (!VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
      throw new BadRequestError(
        `Tipo inválido. Tipos válidos: ${VALID_TYPES.join(', ')}`,
      );
    }

    if (endDate <= startDate) {
      throw new BadRequestError(
        'A data de fim deve ser posterior à data de início',
      );
    }

    const reviewCycle = await this.reviewCyclesRepository.create({
      tenantId,
      name: name.trim(),
      description: description?.trim(),
      type,
      startDate,
      endDate,
    });

    return { reviewCycle };
  }
}
