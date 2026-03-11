import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import {
  type RecurringConfigDTO,
  recurringConfigToDTO,
} from '@/mappers/finance/recurring-config/recurring-config-to-dto';
import type { RecurringConfigsRepository } from '@/repositories/finance/recurring-configs-repository';

interface UpdateRecurringConfigUseCaseRequest {
  id: string;
  tenantId: string;
  description?: string;
  expectedAmount?: number;
  frequencyUnit?: string;
  frequencyInterval?: number;
  endDate?: Date | null;
  interestRate?: number | null;
  penaltyRate?: number | null;
  notes?: string | null;
}

interface UpdateRecurringConfigUseCaseResponse {
  config: RecurringConfigDTO;
}

export class UpdateRecurringConfigUseCase {
  constructor(private recurringConfigsRepository: RecurringConfigsRepository) {}

  async execute(
    request: UpdateRecurringConfigUseCaseRequest,
  ): Promise<UpdateRecurringConfigUseCaseResponse> {
    const { id, tenantId } = request;

    const existing = await this.recurringConfigsRepository.findById(
      id,
      tenantId,
    );

    if (!existing) {
      throw new ResourceNotFoundError('Recurring config not found');
    }

    if (existing.isCancelled) {
      throw new BadRequestError('Cannot update a cancelled recurring config');
    }

    const updated = await this.recurringConfigsRepository.update({
      id,
      tenantId,
      description: request.description,
      expectedAmount: request.expectedAmount,
      frequencyUnit: request.frequencyUnit,
      frequencyInterval: request.frequencyInterval,
      endDate: request.endDate,
      interestRate: request.interestRate,
      penaltyRate: request.penaltyRate,
      notes: request.notes,
    });

    return { config: recurringConfigToDTO(updated!) };
  }
}
