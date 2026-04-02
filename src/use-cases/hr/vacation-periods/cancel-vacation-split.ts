import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { VacationSplit } from '@/entities/hr/vacation-split';
import type { VacationSplitsRepository } from '@/repositories/hr/vacation-splits-repository';

export interface CancelVacationSplitRequest {
  splitId: string;
}

export interface CancelVacationSplitResponse {
  vacationSplit: VacationSplit;
}

export class CancelVacationSplitUseCase {
  constructor(private vacationSplitsRepository: VacationSplitsRepository) {}

  async execute(
    request: CancelVacationSplitRequest,
  ): Promise<CancelVacationSplitResponse> {
    const { splitId } = request;

    const split = await this.vacationSplitsRepository.findById(
      new UniqueEntityID(splitId),
    );

    if (!split) {
      throw new ResourceNotFoundError('VacationSplit');
    }

    if (!split.canCancel()) {
      throw new BadRequestError(
        `Não é possível cancelar parcela com status: ${split.status}`,
      );
    }

    split.cancel();
    await this.vacationSplitsRepository.save(split);

    return { vacationSplit: split };
  }
}
