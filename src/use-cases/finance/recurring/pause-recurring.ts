import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import {
  type RecurringConfigDTO,
  recurringConfigToDTO,
} from '@/mappers/finance/recurring-config/recurring-config-to-dto';
import type { RecurringConfigsRepository } from '@/repositories/finance/recurring-configs-repository';

interface PauseRecurringUseCaseRequest {
  id: string;
  tenantId: string;
}

interface PauseRecurringUseCaseResponse {
  config: RecurringConfigDTO;
}

export class PauseRecurringUseCase {
  constructor(private recurringConfigsRepository: RecurringConfigsRepository) {}

  async execute(
    request: PauseRecurringUseCaseRequest,
  ): Promise<PauseRecurringUseCaseResponse> {
    const { id, tenantId } = request;

    const config = await this.recurringConfigsRepository.findById(id, tenantId);

    if (!config) {
      throw new ResourceNotFoundError('Recurring config not found');
    }

    if (config.isPaused) {
      throw new BadRequestError('Recurring config is already paused');
    }

    if (config.isCancelled) {
      throw new BadRequestError('Cannot pause a cancelled recurring config');
    }

    const updated = await this.recurringConfigsRepository.update({
      id,
      tenantId,
      status: 'PAUSED',
    });

    return { config: recurringConfigToDTO(updated!) };
  }
}
