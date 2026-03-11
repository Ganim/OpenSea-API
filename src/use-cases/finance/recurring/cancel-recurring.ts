import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import {
  type RecurringConfigDTO,
  recurringConfigToDTO,
} from '@/mappers/finance/recurring-config/recurring-config-to-dto';
import type { RecurringConfigsRepository } from '@/repositories/finance/recurring-configs-repository';

interface CancelRecurringUseCaseRequest {
  id: string;
  tenantId: string;
}

interface CancelRecurringUseCaseResponse {
  config: RecurringConfigDTO;
}

export class CancelRecurringUseCase {
  constructor(private recurringConfigsRepository: RecurringConfigsRepository) {}

  async execute(
    request: CancelRecurringUseCaseRequest,
  ): Promise<CancelRecurringUseCaseResponse> {
    const { id, tenantId } = request;

    const config = await this.recurringConfigsRepository.findById(id, tenantId);

    if (!config) {
      throw new ResourceNotFoundError('Recurring config not found');
    }

    if (config.isCancelled) {
      throw new BadRequestError('Recurring config is already cancelled');
    }

    const updated = await this.recurringConfigsRepository.update({
      id,
      tenantId,
      status: 'CANCELLED',
    });

    return { config: recurringConfigToDTO(updated!) };
  }
}
