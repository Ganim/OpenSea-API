import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import {
  type RecurringConfigDTO,
  recurringConfigToDTO,
} from '@/mappers/finance/recurring-config/recurring-config-to-dto';
import type { RecurringConfigsRepository } from '@/repositories/finance/recurring-configs-repository';

interface ResumeRecurringUseCaseRequest {
  id: string;
  tenantId: string;
}

interface ResumeRecurringUseCaseResponse {
  config: RecurringConfigDTO;
}

export class ResumeRecurringUseCase {
  constructor(
    private recurringConfigsRepository: RecurringConfigsRepository,
  ) {}

  async execute(
    request: ResumeRecurringUseCaseRequest,
  ): Promise<ResumeRecurringUseCaseResponse> {
    const { id, tenantId } = request;

    const config = await this.recurringConfigsRepository.findById(
      id,
      tenantId,
    );

    if (!config) {
      throw new ResourceNotFoundError('Recurring config not found');
    }

    if (!config.isPaused) {
      throw new BadRequestError('Can only resume a paused recurring config');
    }

    const updated = await this.recurringConfigsRepository.update({
      id,
      tenantId,
      status: 'ACTIVE',
    });

    return { config: recurringConfigToDTO(updated!) };
  }
}
